import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** Sign-in, presence and the referral link */
export default class MRGSession extends FarmerModule {
  /** Sign in and read the account */
  async login() {
    await this.ctx.api.verifyAccount();
    await this.ctx.state.load();

    /** The page reads these on load too, and their failure blocks nothing */
    await this.ctx.api.fetchPnlHistory().catch(() => null);

    return this.ctx.state.data;
  }

  /** Report presence without letting a failure stop the pass */
  async updatePresence(present) {
    try {
      await (present ? this.ctx.api.ping() : this.ctx.api.leavePresence());
    } catch (error) {
      this.logger.warn("Failed to update presence:", error.message);
    }
  }

  /** Get Referral Link */
  getReferralLink() {
    const referralCode = this.ctx.state.data?.user?.["referralCode"];

    return referralCode
      ? `https://t.me/mrgminerbot/app?startapp=ref_${referralCode}`
      : this.core.drop.telegramLink;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    const friends = await this.ctx.api.fetchFriends();

    return friends?.["teamStats"]?.["totalFriends"] || 0;
  }
}
