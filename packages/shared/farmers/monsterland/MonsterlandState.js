import MonsterlandApi from "./MonsterlandApi.js";

/** The account state and the parts of it every pass reads */
export default class MonsterlandState extends MonsterlandApi {
  /** Re-read the account into the farmer */
  async loadState() {
    this.state_data = await this.fetchUser();
    this.state_data.loadedAt = Date.now();
    return this.state_data;
  }

  /** Read the state once, for entry points that run without a full pass */
  async ensureStateLoaded() {
    if (!this.state_data) {
      await this.loadState();
    }

    return this.state_data;
  }

  /** The player's profile */
  getProfile() {
    return this.state_data?.profile || {};
  }

  /** The player's item and egg counts */
  getInventory() {
    return this.state_data?.inventory || {};
  }

  /** Every monster and egg the account holds */
  getMonsters() {
    return this.state_data?.monsters || [];
  }

  /** The lumis balance */
  getLumis() {
    return Number(this.getProfile()["lumis"]) || 0;
  }

  /** Fold a returned balance and inventory changes into the state */
  applyResult(result) {
    const profile = this.getProfile();
    const lumis = result?.["newLumis"] ?? result?.["new_balance"];

    if (lumis !== undefined && lumis !== null) {
      profile["lumis"] = Number(lumis);
    }

    if (result?.["inventoryUpdates"]) {
      Object.assign(this.getInventory(), result["inventoryUpdates"]);
    }
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ensureStateLoaded();

    return Number(this.state_data?.referral?.["total_referrals"]) || 0;
  }

  /* --------------------------------------------------------------------- */
  /* Care                                                                  */
  /* --------------------------------------------------------------------- */

  /** Server time, as the last state read reported it */
  getServerNow() {
    const serverTime = Number(this.state_data?.serverTime);
    const offset = this.state_data?.loadedAt
      ? Date.now() - this.state_data.loadedAt
      : 0;

    return serverTime ? serverTime + offset : Date.now();
  }
}
