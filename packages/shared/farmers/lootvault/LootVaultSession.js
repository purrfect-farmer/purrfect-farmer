import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { REFERRAL_BOT_LINK, REFERRAL_PREFIX } from "./constants.js";

/** Registration and the referral link */
export default class LootVaultSession extends FarmerModule {
  /** The referral code and friends, read once */
  friends = null;

  /** The inviter's code, without the prefix the start param carries */
  getReferrerCode() {
    const startParam = this.core.referrerStartParam();

    return startParam.startsWith(REFERRAL_PREFIX)
      ? startParam.slice(REFERRAL_PREFIX.length)
      : startParam;
  }

  /** Register the account on an address, the way onboarding does */
  async register(address) {
    const check = await this.ctx.api.checkWallet(address);

    if (!check?.["available"]) {
      const message = "The wallet is already registered to another account";

      this.logger.error(message);
      return { status: false, message };
    }

    const captchaToken = await this.ctx.captcha.obtainToken();
    const ref = this.getReferrerCode();

    await this.ctx.api.register({
      ref: ref || undefined,
      captchaToken,
      address,
    });

    this.logger.success(`Registered on ${address}.`);
    await this.ctx.state.load();

    return { status: true, message: "Registered" };
  }

  /** The referral code and friends */
  async loadFriends() {
    return (this.friends ||= await this.ctx.api.fetchFriends());
  }

  /** Drop the cached friends, so the next read is fresh */
  forgetFriends() {
    this.friends = null;
  }

  /** Get Referral Link */
  async getReferralLink() {
    const { ref_code: code } = await this.loadFriends();

    return `${REFERRAL_BOT_LINK}${code || this.core.userId()}`;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    const { friends } = await this.loadFriends();

    return (friends || []).length;
  }
}
