import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account state as the drop last returned it */
export default class VictorsState extends FarmerModule {
  /** The full account state */
  data = null;

  /** When `data` was read, for projecting what has been mined since */
  readAt = 0;

  /** Re-read the state */
  async load() {
    this.apply(await this.ctx.api.fetchMe());
    return this.data;
  }

  /** Read the state once, for entry points that run without a full pass */
  async ensureLoaded() {
    if (!this.data) {
      await this.ctx.session.login();
    }

    return this.data;
  }

  /** Fold an action's returned state in, noting when it was read */
  apply(result) {
    if (result?.["state"]) {
      this.data = result["state"];
      this.readAt = Date.now();
    }

    const levelChange = result?.["levelChange"];

    if (levelChange) {
      this.logger.info(
        `Level changed from ${levelChange["from"]} to ${levelChange["to"]}.`,
      );
    }
  }

  /** The user record */
  user() {
    return this.data.user;
  }

  /** The mining session as the drop reports it */
  mining() {
    return this.data?.mining || {};
  }

  /** The wallet verification as the drop reports it */
  verify() {
    return this.data?.verify || {};
  }

  /** The drop's live config */
  config() {
    return this.data?.config || {};
  }
}
