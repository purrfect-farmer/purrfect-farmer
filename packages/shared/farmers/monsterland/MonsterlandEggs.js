import {
  DEFAULT_MONSTER_SLOTS,
  EGG_TYPES,
  FRAGMENTS_PER_EGG,
  INCUBATION_MAXIMUM_ADS,
} from "./constants.js";

/** Trait: fragments, incubation and hatching */
export default class MonsterlandEggs {
  /* --------------------------------------------------------------------- */
  /* Eggs                                                                  */
  /* --------------------------------------------------------------------- */

  /** Turn fragments into eggs, incubate what fits, and hatch what is ready */
  async manageEggs() {
    for (const type of EGG_TYPES) {
      const fragments = Number(this.getInventory()[`${type}_fragment`]) || 0;

      if (fragments < FRAGMENTS_PER_EGG) continue;

      const result = await this.claimEggFromFragments(type);

      if (!result.ok) {
        this.logger.warn(
          `Failed to claim ${type} from fragments:`,
          result.data["error"],
        );
        continue;
      }

      if (result.data["inventory"]) {
        Object.assign(this.getInventory(), result.data["inventory"]);
      }

      this.logger.success(`Claimed a ${type} from fragments.`);
    }

    await this.hatchReadyEggs();
    await this.incubateEggs();
  }

  /** Hatch every egg whose incubation has ended */
  async hatchReadyEggs() {
    const now = this.getServerNow();
    const ready = this.getMonsters().filter(
      (egg) =>
        egg["is_egg"] &&
        egg["incubation"]?.["ends_at"] &&
        new Date(egg["incubation"]["ends_at"]).getTime() <= now,
    );

    for (const egg of ready) {
      const result = await this.hatchEgg(egg["_id"]);

      if (result.ok && result.data["monster"]) {
        this.logger.success(
          `Hatched ${result.data["monster"]["name"] || "a monster"} (${result.data["monster"]["rarity"] || "?"}).`,
        );
        continue;
      }

      if (result.data["code"] === "MONSTER_GENERATING") {
        this.logger.info("The monster is still being generated.");
        continue;
      }

      this.logger.warn("Failed to hatch egg:", result.data["error"]);
    }

    if (ready.length) {
      await this.loadState();
    }
  }

  /** Incubate eggs from the inventory while slots are free */
  async incubateEggs() {
    const slots =
      Number(this.getProfile()["monster_slots"]) || DEFAULT_MONSTER_SLOTS;
    let occupied = this.getMonsters().filter(
      (monster) => !monster["is_mentor"] && !this.hasLifespanExpired(monster),
    ).length;

    for (const type of EGG_TYPES) {
      while (
        occupied < slots &&
        (Number(this.getInventory()[type]) || 0) > 0 &&
        !this.signal.aborted
      ) {
        const result = await this.incubateEgg(type);

        if (!result.ok || !result.data["egg"]) {
          this.logger.warn(`Failed to incubate ${type}:`, result.data["error"]);
          return;
        }

        this.getInventory()[type] = Number(this.getInventory()[type]) - 1;
        this.getMonsters().push(result.data["egg"]);
        occupied++;

        this.logger.success(`Incubating a ${type}.`);
      }
    }
  }

  /** Watch incubation ads on every egg still incubating, so it hatches sooner */
  async boostIncubations() {
    const eggs = this.getMonsters().filter(
      (egg) =>
        egg["is_egg"] &&
        egg["incubation"]?.["ends_at"] &&
        new Date(egg["incubation"]["ends_at"]).getTime() > this.getServerNow(),
    );

    let boosted = 0;

    for (const egg of eggs) {
      const maximum =
        INCUBATION_MAXIMUM_ADS[egg["incubation"]["egg_type"]] ??
        INCUBATION_MAXIMUM_ADS["mystery_egg"];
      let watched = Number(egg["incubation"]["ads_watched"]) || 0;

      while (
        watched < maximum &&
        !this.adsUnavailable &&
        !this.signal.aborted
      ) {
        const result = await this.watchAdFor("incubation_boost", {
          eggId: egg["_id"],
        });

        if (!result) break;

        watched++;
        boosted++;

        if (result["egg"]?.["incubation"]) {
          egg["incubation"] = result["egg"]["incubation"];
        }

        this.logger.success(
          `Boosted ${egg["incubation"]["egg_type"]} incubation (${watched}/${maximum}).`,
        );

        if (
          new Date(egg["incubation"]["ends_at"]).getTime() <=
          this.getServerNow()
        ) {
          break;
        }
      }
    }

    if (boosted) {
      await this.loadState();
      await this.hatchReadyEggs();
    }
  }
}
