import BaseFarmer from "../../lib/BaseFarmer.js";

/** Trait: loading and persisting the account state */
export default class MRGState {
  /** Re-read the account into the farmer's state */
  async loadAccount() {
    this.account_data = await this.fetchAccount();
    return this.account_data;
  }

  /** Read the account once, for entry points that run without a full pass */
  async ensureStateLoaded() {
    if (!this.account_data) {
      await this.login();
    }

    return this.account_data;
  }

  /** Load data */
  async load() {
    await BaseFarmer.prototype.load.call(this);
    await this.restoreHumanCheck();
    this.taskClaims = (await this.storage?.get("taskClaims")) || {};
    this.ineligibleTasks = (await this.storage?.get("ineligibleTasks")) || [];
    this.nftHoldings = null;
  }

  /** Persist data */
  async persist() {
    await this.storage?.set("taskClaims", this.taskClaims || {});
    await this.storage?.set("ineligibleTasks", this.ineligibleTasks || []);
  }

  /** Get User Details */
  getAccountDetails() {
    return this.account_data.user;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    const friends = await this.fetchFriends();

    return friends?.["teamStats"]?.["totalFriends"] || 0;
  }
}
