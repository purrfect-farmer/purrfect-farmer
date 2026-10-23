import {
  HUMAN_PASS_EXPIRY_MARGIN_SECONDS,
  TURNSTILE_PAGE_URL,
  TURNSTILE_SITE_KEY,
} from "./constants.js";
import VictorsApi from "./VictorsApi.js";

/** The Turnstile human pass and how long it is trusted */
export default class VictorsHumanPass extends VictorsApi {
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
    return (this.humanPassPromise ||= this.solveHumanCheck().finally(() => {
      this.humanPassPromise = null;
    }));
  }

  /** Solve Turnstile, sign in and store the pass the backend hands back */
  async solveHumanCheck() {
    this.humanPass = null;

    if (!this.canSolveTurnstile()) {
      throw new Error(
        "Captcha is required but no captcha provider is configured!",
      );
    }

    this.logger.info("Solving the security check...");

    const turnstileToken = await this.solveTurnstile({
      siteKey: TURNSTILE_SITE_KEY,
      pageUrl: TURNSTILE_PAGE_URL,
    });

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
