import VictorsHumanPass from "./VictorsHumanPass.js";

/** Loading the account state and reading parts of it */
export default class VictorsState extends VictorsHumanPass {
  /** Re-read the state into the farmer */
  async loadState() {
    this.applyResult(await this.fetchMe());
    return this.state_data;
  }

  /** Read the state once, for entry points that run without a full pass */
  async ensureStateLoaded() {
    if (!this.state_data) {
      await this.login();
    }

    return this.state_data;
  }

  /** Fold an action's returned state into the farmer, noting when it was read */
  applyResult(result) {
    if (result?.["state"]) {
      this.state_data = result["state"];
      this.stateReadAt = Date.now();
    }

    const levelChange = result?.["levelChange"];

    if (levelChange) {
      this.logger.info(
        `Level changed from ${levelChange["from"]} to ${levelChange["to"]}.`,
      );
    }
  }

  /** Load data */
  async load() {
    await super.load();
    await this.restoreHumanPass();
  }

  /** Get User Details */
  getUserDetails() {
    return this.state_data.user;
  }

  /** The mining session as the drop reports it */
  getMining() {
    return this.state_data?.mining || {};
  }

  /** The wallet verification as the drop reports it */
  getVerify() {
    return this.state_data?.verify || {};
  }

  /** The drop's live config */
  getConfig() {
    return this.state_data?.config || {};
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ensureStateLoaded();

    return Number(this.state_data.referral?.["referralsCount"]) || 0;
  }
}
