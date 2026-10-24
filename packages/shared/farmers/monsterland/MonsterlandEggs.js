import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  DEFAULT_MONSTER_SLOTS,
  EGG_TYPES,
  FRAGMENTS_PER_EGG,
  INCUBATION_MAXIMUM_ADS,
} from "./constants.js";

/** Hatching, incubating and boosting eggs */
export default class MonsterlandEggs extends FarmerModule {
  /** Turn fragments into eggs, incubate what fits, and hatch what is ready */
  async manageEggs() {
    for (const type of EGG_TYPES) {
      const fragments =
        Number(this.ctx.state.inventory()[`${type}_fragment`]) || 0;

      if (fragments < FRAGMENTS_PER_EGG) continue;

      const result = await this.ctx.api.claimEggFromFragments(type);

      if (!result.ok) {
        this.logger.warn(
          `Failed to claim ${type} from fragments:`,
          result.data["error"],
        );
        continue;
      }

      if (result.data["inventory"]) {
        Object.assign(this.ctx.state.inventory(), result.data["inventory"]);
      }

      this.logger.success(`Claimed a ${type} from fragments.`);
    }

    await this.hatchReadyEggs();
    await this.incubateEggs();
  }

  /** Hatch every egg whose incubation has ended */
  async hatchReadyEggs() {
    const now = this.ctx.state.getServerNow();
    const ready = this.ctx.state
      .monsters()
      .filter(
        (egg) =>
          egg["is_egg"] &&
          egg["incubation"]?.["ends_at"] &&
          new Date(egg["incubation"]["ends_at"]).getTime() <= now,
      );

    for (const egg of ready) {
      const result = await this.ctx.api.hatchEgg(egg["_id"]);

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
      await this.ctx.state.load();
    }
  }

  /** Incubate eggs from the inventory while slots are free */
  async incubateEggs() {
    const slots =
      Number(this.ctx.state.profile()["monster_slots"]) ||
      DEFAULT_MONSTER_SLOTS;
    let occupied = this.ctx.state
      .monsters()
      .filter(
        (monster) =>
          !monster["is_mentor"] && !this.ctx.care.hasLifespanExpired(monster),
      ).length;

    for (const type of EGG_TYPES) {
      while (
        occupied < slots &&
        (Number(this.ctx.state.inventory()[type]) || 0) > 0 &&
        !this.signal.aborted
      ) {
        const result = await this.ctx.api.incubateEgg(type);

        if (!result.ok || !result.data["egg"]) {
          this.logger.warn(`Failed to incubate ${type}:`, result.data["error"]);
          return;
        }

        this.ctx.state.inventory()[type] =
          Number(this.ctx.state.inventory()[type]) - 1;
        this.ctx.state.monsters().push(result.data["egg"]);
        occupied++;

        this.logger.success(`Incubating a ${type}.`);
      }
    }
  }

  /** Watch incubation ads on every egg still incubating, so it hatches sooner */
  async boostIncubations() {
    const eggs = this.ctx.state
      .monsters()
      .filter(
        (egg) =>
          egg["is_egg"] &&
          egg["incubation"]?.["ends_at"] &&
          new Date(egg["incubation"]["ends_at"]).getTime() >
            this.ctx.state.getServerNow(),
      );

    let boosted = 0;

    for (const egg of eggs) {
      const maximum =
        INCUBATION_MAXIMUM_ADS[egg["incubation"]["egg_type"]] ??
        INCUBATION_MAXIMUM_ADS["mystery_egg"];
      let watched = Number(egg["incubation"]["ads_watched"]) || 0;

      while (
        watched < maximum &&
        !this.ctx.adWatcher.unavailable &&
        !this.signal.aborted
      ) {
        const result = await this.ctx.adWatcher.watchAdFor("incubation_boost", {
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
          this.ctx.state.getServerNow()
        ) {
          break;
        }
      }
    }

    if (boosted) {
      await this.ctx.state.load();
      await this.hatchReadyEggs();
    }
  }
}
