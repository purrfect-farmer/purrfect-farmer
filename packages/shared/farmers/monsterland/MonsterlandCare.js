import {
  DAY_MS,
  DECAY_MODIFIERS,
  DECAY_RATES,
  DREAMER_SLEEP_MULTIPLIER,
  EGG_LIFESPAN_DAYS,
  HUNGER_POTION_MINIMUM_SAVED_FEEDS,
  INFLUENCER_LIFESPAN_DAYS,
  LUMIS_RESERVE,
  MAXIMUM_ITEMS_PER_VITAL,
  PRISTINE_HYGIENE_FLOOR,
  RARITY_LIFESPAN_DAYS,
  SLEEP_ENERGY_PER_HOUR,
  SLEEP_ENERGY_THRESHOLD,
  SLEEP_MAX_HOURS,
  VITAL_ITEMS,
  VITAL_TARGETS,
} from "./constants.js";
import MonsterlandEggs from "./MonsterlandEggs.js";

/** Monster lifespans, vitals, sleep and potions */
export default class MonsterlandCare extends MonsterlandEggs {
  /** How long a monster lives, the way the page works it out */
  getLifespanDays(monster) {
    if (
      monster["source_egg"] === "arcane_egg" ||
      monster["origin"] === "fusion"
    ) {
      return EGG_LIFESPAN_DAYS.arcane_egg;
    }

    if (monster["personality"] === "influencer") {
      return INFLUENCER_LIFESPAN_DAYS;
    }

    return (
      EGG_LIFESPAN_DAYS[monster["source_egg"]] ??
      RARITY_LIFESPAN_DAYS[monster["rarity"]] ??
      RARITY_LIFESPAN_DAYS.common
    );
  }

  /** Whether a hatched monster has outlived its lifespan */
  hasLifespanExpired(monster) {
    if (!monster["rarity"] || !monster["hatched_at"]) return false;

    const hatchedAt = new Date(monster["hatched_at"]).getTime();

    return (
      Number.isFinite(hatchedAt) &&
      this.getServerNow() - hatchedAt >= this.getLifespanDays(monster) * DAY_MS
    );
  }

  /** Hatched monsters that still produce */
  getLiveMonsters() {
    return this.getMonsters().filter(
      (monster) =>
        !monster["is_egg"] &&
        !monster["is_mentor"] &&
        !this.hasLifespanExpired(monster),
    );
  }

  /** A monster's vitals now, decayed from when the server last wrote them */
  projectVitals(monster) {
    const vitals = monster["vitals"] || {};
    const current = {
      food: Number(vitals["food"]) || 0,
      hygiene: Number(vitals["hygiene"]) || 0,
      energy: Number(vitals["energy"]) || 0,
    };

    /** Sleep freezes food and hygiene while energy recovers */
    if (monster["is_sleeping"]) {
      return {
        ...current,
        energy: Math.min(
          100,
          current.energy +
            this.getSleepHours(monster) * this.getSleepRecoveryRate(monster),
        ),
      };
    }

    const lastUpdated = vitals["last_updated"]
      ? new Date(vitals["last_updated"]).getTime()
      : this.getServerNow();
    const hours = Math.max(0, (this.getServerNow() - lastUpdated) / 36e5);
    const personality = String(monster["personality"] || "").toLowerCase();
    const modifiers = DECAY_MODIFIERS[personality] || {};
    const hungerStoppedUntil = this.getHungerStoppedUntil(monster);
    const foodHours = Math.max(
      0,
      (this.getServerNow() - Math.max(lastUpdated, hungerStoppedUntil)) / 36e5,
    );
    const hygieneFloor =
      personality === "pristine" ? PRISTINE_HYGIENE_FLOOR : 0;

    return {
      food: Math.max(
        0,
        current.food - DECAY_RATES.food * (modifiers.food ?? 1) * foodHours,
      ),
      hygiene: Math.max(
        hygieneFloor,
        current.hygiene -
          DECAY_RATES.hygiene * (modifiers.hygiene ?? 1) * hours,
      ),
      energy: Math.max(
        0,
        current.energy - DECAY_RATES.energy * (modifiers.energy ?? 1) * hours,
      ),
    };
  }

  /** When a hunger potion stops holding a monster's food, 0 when none ran */
  getHungerStoppedUntil(monster) {
    const until = monster["active_state"]?.["hunger_decay_stopped_until"];
    const time = until ? new Date(until).getTime() : 0;

    return Number.isFinite(time) ? time : 0;
  }

  /** Hours a sleeping monster has been asleep */
  getSleepHours(monster) {
    const startedAt = monster["sleep_started_at"]
      ? new Date(monster["sleep_started_at"]).getTime()
      : this.getServerNow();

    return Math.max(0, (this.getServerNow() - startedAt) / 36e5);
  }

  /** Energy a monster recovers per hour of sleep */
  getSleepRecoveryRate(monster) {
    return String(monster["personality"] || "").toLowerCase() === "dreamer"
      ? SLEEP_ENERGY_PER_HOUR * DREAMER_SLEEP_MULTIPLIER
      : SLEEP_ENERGY_PER_HOUR;
  }

  /** Keep every monster fed, clean and rested */
  async careForMonsters() {
    await this.loadState();

    const monsters = this.getLiveMonsters();

    if (!monsters.length) {
      this.logger.info("No hatched monsters to care for.");
      return;
    }

    for (const monster of monsters) {
      if (this.signal.aborted) return;

      await this.careForMonster(monster);
    }
  }

  /** Wake, top up, or put one monster to sleep */
  async careForMonster(monster) {
    const name = monster["name"] || monster["_id"];

    if (monster["is_sleeping"]) {
      await this.wakeIfRested(monster, name);
      return;
    }

    const vitals = this.projectVitals(monster);
    const hungry = vitals.food < VITAL_TARGETS.food;

    for (const vital of ["food", "hygiene", "energy"]) {
      vitals[vital] = await this.topUpVital(
        monster,
        name,
        vital,
        vitals[vital],
      );

      /** The potion holds food where it is, so it goes on after the feed */
      if (vital === "food" && hungry && !this.signal.aborted) {
        await this.applyHungerPotion(monster, name);
      }
    }

    if (vitals.energy < SLEEP_ENERGY_THRESHOLD) {
      await this.startSleep(monster, name);
    }
  }

  /** Wake a monster once its sleep has run its course */
  async wakeIfRested(monster, name) {
    const hours = this.getSleepHours(monster);
    const energy = this.projectVitals(monster).energy;

    if (hours < SLEEP_MAX_HOURS && energy < 100) {
      const left = Math.min(
        SLEEP_MAX_HOURS - hours,
        (100 - energy) / this.getSleepRecoveryRate(monster),
      );

      this.logger.info(
        `${name} sleeps for another ${Math.ceil(left * 60)} minute(s).`,
      );
      return;
    }

    const result = await this.changeSleep(monster["_id"], "wake_up");

    if (!result.ok) {
      if (result.data["reason"] === "no_coffee") {
        this.logger.info(`${name} needs a coffee to wake yet.`);
      } else {
        this.logger.warn(`Failed to wake ${name}:`, result.data["error"]);
      }
      return;
    }

    this.applyResult(result.data);
    this.logger.success(
      `${name} woke up rested${result.data["xp_gained"] ? ` (+${result.data["xp_gained"]} XP)` : ""}.`,
    );
  }

  /** Put a tired monster to sleep */
  async startSleep(monster, name) {
    const result = await this.changeSleep(monster["_id"], "start_sleep");

    if (!result.ok) {
      this.logger.warn(`Failed to put ${name} to sleep:`, result.data["error"]);
      return;
    }

    this.logger.success(`${name} went to sleep.`);
  }

  /** Raise one vital to its target from the inventory, then ads, then lumis */
  async topUpVital(monster, name, vital, value) {
    const target = VITAL_TARGETS[vital];
    let used = 0;

    while (
      value < target &&
      used < MAXIMUM_ITEMS_PER_VITAL &&
      !this.signal.aborted
    ) {
      const result = await this.restoreVital(monster, vital);

      if (!result) break;

      if (result.data["reason"] === "monster_sleeping") {
        this.logger.info(`${name} is asleep.`);
        break;
      }

      used++;
      this.applyResult(result.data);

      const next = Number(result.data["newVitalValue"]);
      value = Number.isFinite(next) ? next : value + result.item.value;

      this.logger.success(
        `${result.source} ${result.item.id} on ${name}: ${vital} ${Math.round(value)}.`,
      );
    }

    return value;
  }

  /** Restore a vital once, the cheapest way available, or `null` when nothing is left to try */
  async restoreVital(monster, vital) {
    const items = VITAL_ITEMS[vital].filter((item) => !item.buffHours);
    const inventory = this.getInventory();
    const owned = items.find((item) => Number(inventory[item.id]) > 0);

    if (owned) {
      const result = await this.applyVitalItem(
        monster["_id"],
        owned.id,
        "use_inventory",
      );

      if (result.ok) {
        if (!result.data["inventoryUpdates"]) {
          inventory[owned.id] = Number(inventory[owned.id]) - 1;
        }

        return { ...result, item: owned, source: "Used" };
      }

      this.logger.warn(`Failed to use ${owned.id}:`, result.data["error"]);
      inventory[owned.id] = 0;
    }

    const adItem = items.find((item) => item.ads === 1);

    if (adItem && !this.adsUnavailable) {
      const data = await this.watchAdFor("vitals", {
        monsterId: monster["_id"],
        itemId: adItem.id,
      });

      if (data) {
        return { ok: true, data, item: adItem, source: "Watched ad for" };
      }
    }

    /** Sleep restores energy for free, so energy is never bought */
    if (vital === "energy") return null;

    const cheapest = items[0];

    if (this.getLumis() - cheapest.price < LUMIS_RESERVE) {
      this.logger.info(`Not enough lumis to buy ${cheapest.id}.`);
      return null;
    }

    const result = await this.applyVitalItem(
      monster["_id"],
      cheapest.id,
      "purchase",
    );

    if (!result.ok) {
      this.logger.warn(`Failed to buy ${cheapest.id}:`, result.data["error"]);
      return null;
    }

    return { ...result, item: cheapest, source: "Bought" };
  }

  /** Stop a fed monster's hunger with a potion, unless one is running or it spares too few feeds */
  async applyHungerPotion(monster, name) {
    const potion = VITAL_ITEMS.food.find((item) => item.buffHours);
    const now = this.getServerNow();

    if (this.getHungerStoppedUntil(monster) > now) return;

    const hours = Math.min(potion.buffHours, this.getLifeHoursLeft(monster));
    const personality = String(monster["personality"] || "").toLowerCase();
    const decay =
      DECAY_RATES.food * (DECAY_MODIFIERS[personality]?.food ?? 1) * hours;
    const feed = VITAL_ITEMS.food[0];
    const savedFeeds = Math.floor(decay / feed.value);

    if (savedFeeds < HUNGER_POTION_MINIMUM_SAVED_FEEDS) return;

    const result = await this.obtainHungerPotion(
      monster,
      potion,
      savedFeeds * feed.price,
    );

    if (!result) return;

    this.applyResult(result.data);

    const until = new Date(result.data["hungerDecayStoppedUntil"]).getTime();

    monster["active_state"] = {
      ...monster["active_state"],
      hunger_decay_stopped_until: new Date(
        Number.isFinite(until) ? until : now + potion.buffHours * 36e5,
      ).toISOString(),
    };

    if (result.data["hungerPotionAdClaimedUntil"] !== undefined) {
      this.getProfile()["hunger_potion_ad_claimed_until"] =
        result.data["hungerPotionAdClaimedUntil"];
    }

    this.logger.success(
      `${result.source} ${potion.id} on ${name}: no hunger for ${potion.buffHours}h.`,
    );
  }

  /** Get a hunger potion onto a monster from the inventory, then its ad sequence, then lumis when the feeds it spares cost as much */
  async obtainHungerPotion(monster, potion, savedLumis) {
    const inventory = this.getInventory();

    if (Number(inventory[potion.id]) > 0) {
      const result = await this.applyVitalItem(
        monster["_id"],
        potion.id,
        "use_inventory",
      );

      if (result.ok) {
        if (!result.data["inventoryUpdates"]) {
          inventory[potion.id] = Number(inventory[potion.id]) - 1;
        }

        return { ...result, source: "Used" };
      }

      this.logger.warn(`Failed to use ${potion.id}:`, result.data["error"]);
      inventory[potion.id] = 0;
    }

    const profile = this.getProfile();
    const claimedUntil = new Date(
      profile["hunger_potion_ad_claimed_until"] || 0,
    ).getTime();

    /** The page locks the potion's ad option until its last claim runs out */
    if (!this.adsUnavailable && !(claimedUntil > this.getServerNow())) {
      const progress = profile["hunger_potion_ad_progress"] || {};
      const watched = Math.max(0, Number(progress["watched"]) || 0);

      this.logger.info(
        `Watching ${Math.max(1, potion.ads - watched)} ad(s) for ${potion.id}...`,
      );

      const data = await this.watchAdSequence("vitals", {
        monsterId: monster["_id"],
        itemId: potion.id,
      });

      if (data) return { ok: true, data, source: "Watched ads for" };

      this.logger.info(`${potion.id} ad sequence broke off, progress is kept.`);
    }

    if (savedLumis < potion.price || !this.canAfford(potion.price)) return null;

    const result = await this.applyVitalItem(
      monster["_id"],
      potion.id,
      "purchase",
    );

    if (!result.ok) {
      this.logger.warn(`Failed to buy ${potion.id}:`, result.data["error"]);
      return null;
    }

    return { ...result, source: "Bought" };
  }

  /** Hours a monster has left to live, unbounded when its hatch time is unknown */
  getLifeHoursLeft(monster) {
    const hatchedAt = new Date(monster["hatched_at"]).getTime();

    if (!Number.isFinite(hatchedAt)) return Infinity;

    return Math.max(
      0,
      (hatchedAt +
        this.getLifespanDays(monster) * DAY_MS -
        this.getServerNow()) /
        36e5,
    );
  }
}
