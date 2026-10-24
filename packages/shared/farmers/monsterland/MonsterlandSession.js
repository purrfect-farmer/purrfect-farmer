import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { BOT_USERNAME } from "./constants.js";

/** The referral link and count */
export default class MonsterlandSession extends FarmerModule {
  /** Get Referral Link */
  async getReferralLink() {
    await this.ctx.state.ensureLoaded();

    const hash =
      this.ctx.state.data?.referral?.["referral_hash"] ||
      this.ctx.state.profile()["referral_hash"];

    return `https://t.me/${BOT_USERNAME}?startapp=ref_${hash}`;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ctx.state.ensureLoaded();

    return Number(this.ctx.state.data?.referral?.["total_referrals"]) || 0;
  }
}
