import { HUMAN_PASS_EXPIRY_MARGIN_SECONDS } from "./constants.js";

/** Trait: the Turnstile human pass and how long it is trusted */
export default class VictorsHumanPass {
  /* --------------------------------------------------------------------- */
  /* Human pass                                                            */
  /* --------------------------------------------------------------------- */

  /** Read the stored pass once, keeping it only while it belongs to this user and has time left */
  async restoreHumanPass() {
    if (this.humanPassRestored) return;

    this.humanPassRestored = true;

    const stored = await this.storage?.get("humanPass");

    if (this.isHumanPassUsable(stored)) {
      this.humanPass = stored;
    }
  }

  /** The pass reads `<telegramId>.<expiresAt>.<signature>` */
  parseHumanPass(pass) {
    const [userId, expiresAt] = String(pass || "").split(".");

    return { userId, expiresAt: Number(expiresAt) || 0 };
  }

  /** Whether a pass is this user's and outlives the safety margin */
  isHumanPassUsable(pass) {
    if (typeof pass !== "string" || !pass) return false;

    const { userId, expiresAt } = this.parseHumanPass(pass);

    return (
      userId === String(this.getUserId()) &&
      expiresAt - Date.now() / 1000 > HUMAN_PASS_EXPIRY_MARGIN_SECONDS
    );
  }

  /** Keep a pass in memory and in storage, so the next run skips the captcha */
  async storeHumanPass(pass) {
    this.humanPass = pass || null;

    try {
      await this.storage?.set("humanPass", this.humanPass);
    } catch (error) {
      this.logger.warn("Failed to store the human pass:", error.message);
    }
  }

  /** Pass the Turnstile check and sign in, sharing one attempt between concurrent callers */
  obtainHumanPass() {
    return this.ctx.humanCheck.obtain();
  }

  /** Sign in with a solved Turnstile token and store the pass the backend hands back */
  async submitHumanPass(turnstileToken) {
    const result = await this.loginWithToken(turnstileToken);

    if (!result?.["humanPass"]) {
      throw new Error(result?.["error"] || "Login returned no human pass");
    }

    await this.storeHumanPass(result["humanPass"]);
    this.applyResult(result);

    const { expiresAt } = this.parseHumanPass(result["humanPass"]);

    this.logger.success(
      `Human pass stored until ${new Date(expiresAt * 1000).toLocaleString()}.`,
    );

    return result;
  }

  /** Forget the stored pass, so the next sign-in solves the captcha again */
  async resetHumanPass() {
    await this.storeHumanPass(null);
    this.logger.success("Human pass cleared.");
  }
}
