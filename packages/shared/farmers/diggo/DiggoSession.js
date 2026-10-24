import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** Sign-in headers and the referral link */
export default class DiggoSession extends FarmerModule {
  /** Get Auth Headers */
  getAuthHeaders(data) {
    return { Authorization: `Bearer ${data["token"]}` };
  }

  /** Get Referral Link */
  getReferralLink() {
    return (
      this.ctx.state.data?.["friends"]?.["inviteUrl"] ||
      this.core.drop.telegramLink
    );
  }

  /** Get Referrals Count */
  getReferralsCount() {
    return this.ctx.state.data?.["friends"]?.["registeredCount"] || 0;
  }
}
