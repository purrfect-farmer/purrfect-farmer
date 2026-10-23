import {
  DAY_MS,
  DEFAULT_MONSTER_SLOTS,
  EGG_TYPES,
  GROW_PAYBACK_DAYS,
  LUMIS_RESERVE,
  MAXIMUM_LEVEL,
  MAXIMUM_MONSTER_SLOTS,
  MAXIMUM_PURCHASES_PER_PASS,
  MONSTER_SLOT_PRICES,
  MYSTERY_EGG_BASE_PRICE,
  MYSTERY_EGG_MAXIMUM_PRICE,
  MYSTERY_EGG_PRICE_GROWTH,
  NEW_MONSTER_VITALS_MULTIPLIER,
  REPLACEMENT_LEAD_HOURS,
  SLOT_2_ADS_REQUIRED,
} from "./constants.js";
import MonsterlandCare from "./MonsterlandCare.js";

/** Levelling monsters and growing the farm with slots and eggs */
export default class MonsterlandGrowth extends MonsterlandCare {
  /* --------------------------------------------------------------------- */
  /* Level                                                                 */
  /* --------------------------------------------------------------------- */

  /** XP a monster needs to leave a level */
  getXPRequiredForLevel(level) {
    return level >= MAXIMUM_LEVEL
      ? Infinity
      : Math.floor(500 * Math.pow(1.25, level - 1));
  }

  /** Level up every monster with the XP for it, leaving the lumis check to the backend */
  async levelUpMonsters() {
    for (const monster of this.getLiveMonsters()) {
      const name = monster["name"] || monster["_id"];
      let level = Number(monster["level"]) || 1;
      let experience = Number(monster["experience"]) || 0;

      while (
        experience >= this.getXPRequiredForLevel(level) &&
        !this.signal.aborted
      ) {
        const result = await this.levelUp(monster["_id"]);

        if (!result.ok) {
          this.logger.warn(`Failed to level up ${name}:`, result.data["error"]);
          break;
        }

        this.applyResult(result.data);

        level = Number(result.data["newLevel"]) || level + 1;
        experience = Number(result.data["remainingXP"]) || 0;

        this.logger.success(`${name} reached level ${level}.`);
      }
    }
  }

  /* --------------------------------------------------------------------- */
  /* Grow                                                                  */
  /* --------------------------------------------------------------------- */

  /** Add monsters: unlock slot 2 with ads, then buy slots and eggs while they pay back */
  async growFarm() {
    await this.loadState();
    await this.unlockSecondSlot();

    let purchases = 0;

    while (purchases < MAXIMUM_PURCHASES_PER_PASS && !this.signal.aborted) {
      const step = this.pickGrowthPurchase();

      if (!step) break;

      const result = await this.buyWithLumis(step.type, step.itemId);

      if (!result.ok || result.data["success"] === false) {
        this.logger.warn(`Failed to buy ${step.label}:`, result.data["error"]);
        break;
      }

      purchases++;
      this.logger.success(
        `Bought ${step.label} for ${this.formatAmount(step.price)} lumis.`,
      );

      await this.loadState();
    }

    await this.incubateEggs();
    await this.boostIncubations();
  }

  /** Slots the account has */
  getMonsterSlots() {
    return Number(this.getProfile()["monster_slots"]) || DEFAULT_MONSTER_SLOTS;
  }

  /** Slots taken by monsters and incubating eggs, leaving out mentors and the dead */
  getOccupiedSlots() {
    return this.getMonsters().filter(
      (monster) => !monster["is_mentor"] && !this.hasLifespanExpired(monster),
    ).length;
  }

  /** Eggs waiting in the inventory */
  getOwnedEggs() {
    return EGG_TYPES.reduce(
      (total, type) => total + (Number(this.getInventory()[type]) || 0),
      0,
    );
  }

  /** The next mystery egg's lumis price, as the store works it out */
  getMysteryEggPrice() {
    const bought =
      Number(this.getProfile()["mystery_egg_lumis_purchases"]) || 0;

    return Math.min(
      MYSTERY_EGG_MAXIMUM_PRICE,
      Math.floor(MYSTERY_EGG_BASE_PRICE * MYSTERY_EGG_PRICE_GROWTH ** bought),
    );
  }

  /** Lumis an hour a newly hatched monster is expected to make, judged from the monsters already owned */
  getExpectedNewMonsterRate() {
    const rates = this.getLiveMonsters()
      .map((monster) => Number(monster["base_production_rate"]))
      .filter((rate) => Number.isFinite(rate) && rate > 0);

    if (!rates.length) return null;

    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

    return average * NEW_MONSTER_VITALS_MULTIPLIER;
  }

  /** Whether spending this much on one more monster pays back in time, always true with no monster to judge by */
  paysBack(price) {
    const rate = this.getExpectedNewMonsterRate();

    if (rate === null) return true;

    return price <= rate * 24 * GROW_PAYBACK_DAYS;
  }

  /** Whether the balance covers a price and still keeps the vitals reserve */
  canAfford(price) {
    return this.getLumis() - price >= LUMIS_RESERVE;
  }

  /** Whether a monster dies before a fresh egg could hatch in its place */
  needsReplacement() {
    const now = this.getServerNow();

    return this.getLiveMonsters().some((monster) => {
      const hatchedAt = new Date(monster["hatched_at"]).getTime();

      if (!Number.isFinite(hatchedAt)) return false;

      const endsAt = hatchedAt + this.getLifespanDays(monster) * DAY_MS;

      return endsAt - now <= REPLACEMENT_LEAD_HOURS * 36e5;
    });
  }

  /** The one purchase that adds a monster soonest, or null when nothing is worth buying */
  pickGrowthPurchase() {
    const slots = this.getMonsterSlots();
    const free = slots - this.getOccupiedSlots();
    const eggs = this.getOwnedEggs();
    const eggPrice = this.getMysteryEggPrice();
    const egg = {
      type: "egg",
      itemId: "mystery_egg",
      price: eggPrice,
      label: "a mystery egg",
    };

    /** A free slot, or a monster about to die, with no egg to fill it */
    if (eggs === 0 && (free > 0 || this.needsReplacement())) {
      if (!this.canAfford(eggPrice)) {
        this.logger.info(
          `A mystery egg costs ${this.formatAmount(eggPrice)} lumis, saving up.`,
        );
        return null;
      }

      if (!this.paysBack(eggPrice)) {
        this.logger.info(
          `A mystery egg at ${this.formatAmount(eggPrice)} lumis would not pay back in ${GROW_PAYBACK_DAYS} days.`,
        );
        return null;
      }

      return egg;
    }

    /** Every slot is taken, so the next monster needs a slot, and an egg unless one is spare */
    if (free <= 0 && slots >= 2 && slots < MAXIMUM_MONSTER_SLOTS) {
      const slotPrice = MONSTER_SLOT_PRICES[slots + 1];
      const total = slotPrice + (eggs > 0 ? 0 : eggPrice);

      if (!slotPrice || !this.canAfford(total)) return null;

      if (!this.paysBack(total)) {
        this.logger.info(
          `Slot ${slots + 1} at ${this.formatAmount(total)} lumis would not pay back in ${GROW_PAYBACK_DAYS} days.`,
        );
        return null;
      }

      return {
        type: "monster_slot",
        itemId: "monster_slot",
        price: slotPrice,
        label: `slot ${slots + 1}`,
      };
    }

    return null;
  }

  /** Unlock the second slot, which costs ads rather than lumis */
  async unlockSecondSlot() {
    if (this.getMonsterSlots() >= 2 || this.adsUnavailable) return;

    this.logger.info(`Unlocking slot 2 with ${SLOT_2_ADS_REQUIRED} ads...`);

    const result = await this.watchAdSequence("monster_slot");

    if (!result) {
      this.logger.warn("Slot 2 is still locked.");
      return;
    }

    this.logger.success("Unlocked slot 2.");

    await this.loadState();
  }
}
