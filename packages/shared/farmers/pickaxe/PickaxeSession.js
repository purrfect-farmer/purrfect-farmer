import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { MINI_APP_LINK } from "./constants.js";

/** The referral link and count */
export default class PickaxeSession extends FarmerModule {
  /** Get Referral Link */
  async getReferralLink() {
    const { invite } = (await this.ctx.state.ensureLoaded()) || {};

    return invite ? `${MINI_APP_LINK}?startapp=${invite}` : MINI_APP_LINK;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    const { refs } = (await this.ctx.state.ensureLoaded()) || {};

    return Number(refs?.["count"]) || 0;
  }
}
