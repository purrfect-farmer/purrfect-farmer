import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** Sign-in, bans and the referral link */
export default class VictorsSession extends FarmerModule {
  /** The ban the drop last reported, with whether it may be reset */
  banInfo = null;

  /** The reset in flight, shared by concurrent banned calls */
  resetting = null;

  /** Remember the ban and the pass it carries, then reset it when allowed or stop whatever was running */
  async handleBan(payload, { reset = true } = {}) {
    if (payload["humanPass"]) {
      await this.ctx.humanPass.store(payload["humanPass"]);
    }

    this.banInfo = {
      error: payload["error"] || "Account is banned",
      canReset: payload["canReset"] === true,
      termsVersion: String(payload["termsVersion"] || ""),
    };

    if (reset && this.banInfo.canReset) {
      return this.resetAccount();
    }

    throw new Error(this.banInfo.error);
  }

  /** Reset the banned account, accepting the terms the ban names, sharing one attempt between concurrent callers */
  resetAccount() {
    return (this.resetting ||= this.runReset().finally(() => {
      this.resetting = null;
    }));
  }

  /** Wipe the banned account and carry on from the fresh state it returns */
  async runReset() {
    const { error, termsVersion } = this.banInfo;
    const result = await this.ctx.api.resetAccount(termsVersion);

    if (result?.["success"] === false) {
      throw new Error(result["error"] || "Failed to reset the account");
    }

    if (result?.["humanPass"]) {
      await this.ctx.humanPass.store(result["humanPass"]);
    }

    this.banInfo = null;
    this.ctx.state.apply(result);
    const terms = termsVersion || "(unversioned)";

    this.logger.success(
      `Account was banned (${error}), reset and accepted terms ${terms}.`,
    );

    return result;
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
