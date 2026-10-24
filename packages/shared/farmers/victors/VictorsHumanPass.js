import FarmerModule from "../../lib/farmer/FarmerModule.js";
import TurnstileGate from "../../lib/farmer/TurnstileGate.js";
import {
  HUMAN_PASS_EXPIRY_MARGIN_SECONDS,
  TURNSTILE_ACTION,
  TURNSTILE_PAGE_URL,
  TURNSTILE_SITE_KEY,
} from "./constants.js";

/** The Turnstile human pass and how long it is trusted */
export default class VictorsHumanPass extends FarmerModule {
  /** The pass the drop signed, sent with every call */
  pass = null;

  /** Whether the stored pass has been read */
  restored = false;

  /** The single-flight Turnstile solve, which drops the old pass first */
  gate = new TurnstileGate({
    siteKey: TURNSTILE_SITE_KEY,
    pageUrl: TURNSTILE_PAGE_URL,
    action: TURNSTILE_ACTION.LOGIN,
    canSolve: () => this.core.captcha.canSolveTurnstile(),
    solveTurnstile: (params) => this.core.captcha.solveTurnstile(params),
    submit: (token) => this.submit(token),
    logger: () => this.logger,
    onStart: () => {
      this.pass = null;
    },
  });

  /** Read the stored pass once, keeping it only while it belongs to this user and has time left */
  async restore() {
    if (this.restored) return;

    this.restored = true;

    const stored = await this.storage?.get("humanPass");

    if (this.isUsable(stored)) {
      this.pass = stored;
    }
  }

  /** The pass reads `<telegramId>.<expiresAt>.<signature>` */
  parse(pass) {
    const [userId, expiresAt] = String(pass || "").split(".");

    return { userId, expiresAt: Number(expiresAt) || 0 };
  }

  /** Whether a pass is this user's and outlives the safety margin */
  isUsable(pass) {
    if (typeof pass !== "string" || !pass) return false;

    const { userId, expiresAt } = this.parse(pass);

    return (
      userId === String(this.core.userId()) &&
      expiresAt - Date.now() / 1000 > HUMAN_PASS_EXPIRY_MARGIN_SECONDS
    );
  }

  /** Keep a pass in memory and in storage, so the next run skips the captcha */
  async store(pass) {
    this.pass = pass || null;

    try {
      await this.storage?.set("humanPass", this.pass);
    } catch (error) {
      this.logger.warn("Failed to store the human pass:", error.message);
    }
  }

  /** Pass the Turnstile check and sign in, sharing one attempt between concurrent callers */
  obtain() {
    return this.gate.obtain();
  }

  /** Sign in with a solved Turnstile token and store the pass the backend hands back */
  async submit(turnstileToken) {
    const result = await this.ctx.api.loginWithToken(turnstileToken);

    if (!result?.["humanPass"]) {
      throw new Error(result?.["error"] || "Login returned no human pass");
    }

    await this.store(result["humanPass"]);
    this.ctx.state.apply(result);

    const { expiresAt } = this.parse(result["humanPass"]);

    this.logger.success(
      `Human pass stored until ${new Date(expiresAt * 1000).toLocaleString()}.`,
    );

    return result;
  }

  /** Forget the stored pass, so the next sign-in solves the captcha again */
  async reset() {
    await this.store(null);
    this.logger.success("Human pass cleared.");
  }
}
