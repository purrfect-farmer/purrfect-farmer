import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  LOOT_TOKEN,
  MINIMUM_TOWER_COLLECT,
  TOWER_SLOT_TYPES,
} from "./constants.js";

/** The key an inventory part is grouped under, by what slot and tier it fits */
function partKey(type, tier) {
  return `${type}:${tier}`;
}

/** The tower: collecting its income and installing the parts the account owns */
export default class LootVaultTower extends FarmerModule {
  /** The income accrued since the last collect, estimated the way the page does */
  getAccrued(tower) {
    const reported = Number(
      tower["accumulatedLoot"] ?? tower["uncollectedLoot"] ?? 0,
    );
    const rate = Number(tower["totalRatePerHour"]) || 0;

    if (!tower["lastCollect"] || rate <= 0) return reported;

    const now = Number(tower["ts"]) || Date.now();
    const hours = (now - new Date(tower["lastCollect"]).getTime()) / 36e5;

    return Math.max(reported, rate * Math.max(0, hours));
  }

  /** Collect the tower income once it clears the page's threshold */
  async collect() {
    const tower = await this.ctx.api.fetchTower();
    const accrued = this.getAccrued(tower);

    if (accrued < MINIMUM_TOWER_COLLECT) {
      this.logger.info("No tower income to collect.");
      return;
    }

    const result = await this.ctx.api.collectTower();
    const collected = result["collected"] ?? result["collectedLoot"] ?? accrued;

    this.logger.success(
      `Collected ${formatAmount(collected)} ${LOOT_TOKEN} from the tower.`,
    );
  }

  /** Install owned parts into every unlocked floor slot they fit */
  async equipParts() {
    const [tower, inventory] = await Promise.all([
      this.ctx.api.fetchTower(),
      this.ctx.api.fetchInventory(),
    ]);
    const parts = this.groupParts(inventory || []);
    let installed = 0;

    for (const floor of tower["floors"] || []) {
      if (!floor["unlocked"] || floor["active"]) continue;

      for (const [slotName, slotType] of Object.entries(TOWER_SLOT_TYPES)) {
        if (this.signal.aborted) return;

        installed += await this.fillSlot({
          floor,
          slot: floor["slots"]?.[slotName],
          slotType,
          parts: parts.get(partKey(slotType, floor["requiredTier"])),
        });
      }
    }

    if (installed) {
      this.logger.success(`Installed ${installed} tower part(s).`);
    } else {
      this.logger.info("No tower parts to install.");
    }
  }

  /** The owned parts, by slot type and tier */
  groupParts(inventory) {
    const parts = new Map();

    for (const item of inventory) {
      const key = partKey(item["type"], item["tier"]);

      if (!parts.has(key)) parts.set(key, []);
      parts.get(key).push(item);
    }

    return parts;
  }

  /** Install parts into one slot until it is full or they run out, returning how many went in */
  async fillSlot({ floor, slot, slotType, parts }) {
    const count = Number(slot?.["count"]) || 0;
    const required = Number(slot?.["required"] ?? floor["requiredPerSlot"]);
    let installed = 0;

    while (parts?.length && count + installed < required) {
      const item = parts.shift();

      await this.ctx.api.equipPart({
        floor: floor["floor"],
        slotType,
        itemId: item["id"],
      });
      installed++;

      await this.utils.delayForSeconds(1, { signal: this.signal });
    }

    return installed;
  }
}
