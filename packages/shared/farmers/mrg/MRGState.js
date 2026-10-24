import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account as the drop last reported it */
export default class MRGState extends FarmerModule {
  /** The full account state: user, level, tasks, transactions */
  data = null;

  /** The user record */
  user() {
    return this.data.user;
  }

  /** Re-read the account */
  async load() {
    this.data = await this.ctx.api.fetchAccount();
    return this.data;
  }

  /** Read the account once, for entry points that run without a full pass */
  async ensureLoaded() {
    if (!this.data) {
      await this.ctx.session.login();
    }

    return this.data;
  }

  /** Replace the user record with the one an action returned */
  setUser(user) {
    this.data.user = user;
  }
}
