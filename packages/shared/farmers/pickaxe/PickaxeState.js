import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { ERROR_CODE } from "./constants.js";
import Decimal from "decimal.js";

/** The account as the drop last returned it */
export default class PickaxeState extends FarmerModule {
  /** The account's state, which every action replies with */
  data = null;

  /** Whether the drop is down for maintenance */
  maintenance = false;

  /** When `data` was read, for projecting what has been mined since */
  readAt = 0;

  /** Re-read the account, reading a maintenance refusal as that state */
  async load() {
    try {
      this.apply(await this.ctx.api.fetchMe());
      this.maintenance = false;
    } catch (error) {
      if (error.code !== ERROR_CODE.MAINTENANCE) throw error;

      this.data = null;
      this.maintenance = true;
    }

    return this.data;
  }

  /** Keep the state an action replied with */
  apply(data) {
    this.data = data;
    this.readAt = Date.now();

    return data;
  }

  /** Read the account once, for entry points that run without a full pass */
  async ensureLoaded() {
    if (!this.data && !this.maintenance) {
      await this.load();
    }

    return this.data;
  }

  /** Whether the drop is down for maintenance */
  isMaintenance() {
    return this.maintenance;
  }

  /** Whether the drop has banned the account */
  isBlocked() {
    return Boolean(this.data?.["banned"]);
  }

  /** Whether the account can be played right now */
  isPlayable() {
    return Boolean(this.data) && !this.isMaintenance() && !this.isBlocked();
  }

  /** Why the account cannot be played, or null when it can */
  unplayableReason() {
    if (this.isBlocked()) return "The account is banned.";
    if (this.isMaintenance()) return "Pickaxe Empire is under maintenance.";
    if (!this.data) return "The account could not be read.";

    return null;
  }

  /** The Ancient Pass */
  pass() {
    return this.data?.["pass"] || {};
  }

  /** Whether the Ancient Pass is active, which opens mining */
  isPassActive() {
    return Boolean(this.pass()["active"]);
  }

  /** The current level */
  level() {
    return Number(this.data?.["level"]) || 0;
  }

  /** The in-app balance, which withdrawals draw from */
  balance() {
    return new Decimal(this.data?.["inApp"] || 0);
  }

  /** The PXE the linked wallet holds, as the drop counts it */
  holding() {
    return new Decimal(this.data?.["onchain"] || 0);
  }

  /** What the storage holds now, projected from the last read and capped at the storage size */
  unclaimed() {
    const data = this.data || {};
    const unclaimed = Number(data["unclaimed"]) || 0;

    if (!data["mining"]) return unclaimed;

    const mined =
      ((Number(data["perDay"]) || 0) * (Date.now() - this.readAt)) / 864e5;

    return Math.min(
      Math.max(Number(data["storageCap"]) || 0, unclaimed),
      unclaimed + mined,
    );
  }
}
