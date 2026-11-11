import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The referral link and count */
export default class MyAgeSession extends FarmerModule {
  /** Get Referral Link */
  async getReferralLink() {
    const data = await this.ctx.state.ensureLoaded();

    return data?.["invite"] || this.core.drop.telegramLink;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ctx.state.ensureLoaded();

    return Number(this.ctx.state.user()["refCount"]) || 0;
  }
}
