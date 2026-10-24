import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { escapeHtml, formatAccountLink } from "../../lib/farmer/format.js";

/** Sign-in, bans and the referral link */
export default class VictorsSession extends FarmerModule {
  /** The ban the drop last reported, with whether it may be reset */
  banInfo = null;

  /** The reset in flight, shared by concurrent banned calls */
  resetting = null;

  /** Whether a resettable ban is reset on its own, off while a tool asks first */
  autoReset = true;

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

    if (reset && this.autoReset && this.banInfo.canReset) {
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

    await this.notifyReset(error, terms);

    return result;
  }

  /** Tell the admin and the account's user that the ban was reset and its progress wiped */
  async notifyReset(error, terms) {
    const messages = [
      `<b>♻️ ${escapeHtml(this.core.drop.title)} Account Reset</b>`,
      `<b>Account</b>: ${formatAccountLink(this.core.userId())}`,
      `<b>Ban</b>: ${escapeHtml(error)}`,
      `<b>Terms</b>: ${escapeHtml(terms)}`,
      `<i>The balance and progress were wiped, so the wallet must be connected and verified again.</i>`,
    ];

    try {
      await Promise.all([
        this.core.notifyAdmin(messages),
        this.core.notifyUser(messages),
      ]);
    } catch (error) {
      this.logger.warn("Failed to send the reset notice:", error.message);
    }
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

  /** Sign in without resetting a ban, so the caller can ask before the account is wiped */
  async loginWithoutReset() {
    this.autoReset = false;

    try {
      return await this.login();
    } finally {
      this.autoReset = true;
    }
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
