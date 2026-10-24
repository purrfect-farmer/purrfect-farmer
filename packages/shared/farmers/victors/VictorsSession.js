import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** Sign-in, bans and the referral link */
export default class VictorsSession extends FarmerModule {
  /** The ban the drop last reported, with whether it may be reset */
  banInfo = null;

  /** Remember the ban and the pass it carries, then stop whatever was running */
  async handleBan(payload) {
    if (payload["humanPass"]) {
      await this.ctx.humanPass.store(payload["humanPass"]);
    }

    this.banInfo = {
      error: payload["error"] || "Account is banned",
      canReset: payload["canReset"] === true,
      termsVersion: String(payload["termsVersion"] || ""),
    };

    throw new Error(
      `${this.banInfo.error}${this.banInfo.canReset ? " (it can be reset from Account tools)" : ""}`,
    );
  }

  /** Sign in on the stored pass, or pass the human check when there is none */
  async login() {
    await this.ctx.humanPass.restore();

    if (this.ctx.humanPass.pass) {
      this.logger.info("Using stored human pass.");
      return this.ctx.state.load();
    }

    await this.ctx.humanPass.obtain();

    return this.ctx.state.data;
  }

  /** Get Referral Link */
  getReferralLink() {
    return (
      this.ctx.state.data?.referral?.["link"] ||
      `https://t.me/VictorsCompanybot/app?startapp=ref_${this.ctx.state.data?.referral?.["code"] || ""}`
    );
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ctx.state.ensureLoaded();

    return Number(this.ctx.state.data.referral?.["referralsCount"]) || 0;
  }
}
