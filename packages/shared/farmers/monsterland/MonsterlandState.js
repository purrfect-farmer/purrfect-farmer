import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account state and the parts of it every pass reads */
export default class MonsterlandState extends FarmerModule {
  /** The account state, stamped with when it was read */
  data = null;

  /** The game's config, with the withdrawal rules and quota */
  config = null;

  /** Re-read the account into the farmer */
  async load() {
    this.data = await this.ctx.api.fetchUser();
    this.data.loadedAt = Date.now();
    return this.data;
  }

  /** Read the state once, for entry points that run without a full pass */
  async ensureLoaded() {
    if (!this.data) {
      await this.load();
    }

    return this.data;
  }

  /** The player's profile */
  profile() {
    return this.data?.profile || {};
  }

  /** The player's item and egg counts */
  inventory() {
    return this.data?.inventory || {};
  }

  /** Every monster and egg the account holds */
  monsters() {
    return this.data?.monsters || [];
  }

  /** The lumis balance */
  lumis() {
    return Number(this.profile()["lumis"]) || 0;
  }

  /** Fold a returned balance and inventory changes into the state */
  apply(result) {
    const profile = this.profile();
    const lumis = result?.["newLumis"] ?? result?.["new_balance"];

    if (lumis !== undefined && lumis !== null) {
      profile["lumis"] = Number(lumis);
    }

    if (result?.["inventoryUpdates"]) {
      Object.assign(this.inventory(), result["inventoryUpdates"]);
    }
  }

  /** Server time, as the last state read reported it */
  getServerNow() {
    const serverTime = Number(this.data?.serverTime);
    const offset = this.data?.loadedAt ? Date.now() - this.data.loadedAt : 0;

    return serverTime ? serverTime + offset : Date.now();
  }
}
