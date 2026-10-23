import { HUMAN_CHECK_EXPIRY_MARGIN_SECONDS } from "./constants.js";

/** Trait: the Turnstile human check and how long it is trusted */
export default class MRGHumanCheck {
  /* --------------------------------------------------------------------- */
  /* Human check                                                           */
  /* --------------------------------------------------------------------- */

  /** Read the stored check once, keeping it only while it belongs to this user */
  async restoreHumanCheck() {
    if (this.humanCheckRestored) return;

    this.humanCheckRestored = true;

    const stored = await this.storage?.get("humanCheck");

    if (stored?.["userId"] === String(this.getUserId())) {
      this.humanVerifiedUntil = stored["until"] || null;
    }
  }

  /** When the check runs out, as the later of the stored and the server's reading */
  getHumanVerifiedUntil() {
    const times = [
      this.humanVerifiedUntil,
      this.account_data?.user?.["humanVerifiedUntil"],
    ]
      .map((value) => (value ? new Date(value).getTime() : 0))
      .filter((time) => Number.isFinite(time) && time > 0);

    return times.length ? Math.max(...times) : 0;
  }

  /** Whether the check outlives the safety margin */
  isHumanCheckValid() {
    return (
      this.getHumanVerifiedUntil() - Date.now() >
      HUMAN_CHECK_EXPIRY_MARGIN_SECONDS * 1000
    );
  }

  /** Keep the check's expiry in memory and in storage, so the next run skips the captcha */
  async storeHumanCheck(until) {
    this.humanVerifiedUntil = until || null;

    if (this.account_data?.user) {
      this.account_data.user["humanVerifiedUntil"] = this.humanVerifiedUntil;
    }

    try {
      await this.storage?.set(
        "humanCheck",
        this.humanVerifiedUntil
          ? { userId: String(this.getUserId()), until: this.humanVerifiedUntil }
          : null,
      );
    } catch (error) {
      this.logger.warn("Failed to store the human check:", error.message);
    }
  }

  /** Pass the human check, sharing one attempt between concurrent callers */
  obtainHumanCheck() {
    return this.ctx.humanCheck.obtain();
  }

  /** Hand a solved Turnstile token over and store how long the backend now trusts the account */
  async submitHumanCheck(turnstileToken) {
    const result = await this.verifyHuman(turnstileToken);

    if (!result?.["success"] || !result["humanVerifiedUntil"]) {
      throw new Error(result?.["error"] || "The human check was refused");
    }

    await this.storeHumanCheck(result["humanVerifiedUntil"]);

    this.logger.success(
      `Human check valid until ${new Date(result["humanVerifiedUntil"]).toLocaleString()}.`,
    );

    return result;
  }

  /** Pass the human check only when the stored one has run out */
  async ensureHumanCheck() {
    await this.restoreHumanCheck();

    if (this.isHumanCheckValid()) {
      this.logger.info(
        `Human check valid until ${new Date(this.getHumanVerifiedUntil()).toLocaleString()}.`,
      );
      return;
    }

    await this.obtainHumanCheck();
  }

  /** Pass the human check on demand, whatever the stored one says */
  async renewHumanCheck() {
    await this.ensureStateLoaded();
    await this.obtainHumanCheck();
  }

  /** Forget the stored check, so the next run solves the captcha again */
  async resetHumanCheck() {
    await this.storeHumanCheck(null);
    this.logger.success("Human check cleared.");
  }
}
