import FarmerModule from "../../lib/farmer/FarmerModule.js";
import TurnstileGate from "../../lib/farmer/TurnstileGate.js";
import {
  TURNSTILE_HEADER,
  TURNSTILE_PAGE_URL,
  TURNSTILE_SITE_KEY,
} from "./constants.js";

/** The Turnstile security check and how long its pass lasts */
export default class MonsterlandHumanCheck extends FarmerModule {
  /** The single-flight Turnstile solve */
  gate = new TurnstileGate({
    siteKey: TURNSTILE_SITE_KEY,
    pageUrl: TURNSTILE_PAGE_URL,
    canSolve: () => this.core.captcha.canSolveTurnstile(),
    solveTurnstile: (params) => this.core.captcha.solveTurnstile(params),
    submit: (token) => this.submit(token),
    logger: () => this.logger,
    beforeSolve: () => this.logPreviousPassLifespan(),
  });

  /** Pass the Turnstile check, sharing one attempt between concurrent callers */
  obtain() {
    return this.gate.obtain();
  }

  /** Hand a solved Turnstile token to the backend, which trusts the account for about an hour */
  async submit(token) {
    const result = await this.ctx.api.callApi("post", "/security/turnstile", {
      headers: { [TURNSTILE_HEADER]: token },
      retryTurnstile: false,
    });

    if (!result.ok) {
      throw new Error(
        result.data["error"] || `Security check was refused (${result.status})`,
      );
    }

    this.logger.success("Security check passed.");

    await this.storePass();
  }

  /** Log how long the last pass held, which tells whether it survives between runs */
  async logPreviousPassLifespan() {
    try {
      const stored = await this.storage?.get("turnstilePass");
      const solvedAt = Number(stored?.["solvedAt"]);

      if (solvedAt) {
        const minutes = Math.round((Date.now() - solvedAt) / 6e4);

        this.logger.info(`Security pass lasted ${minutes}m.`);
      }
    } catch (error) {
      this.logger.warn("Failed to read the security pass:", error.message);
    }
  }

  /** Remember when the pass was earned, so the next solve can report its lifespan */
  async storePass() {
    try {
      await this.storage?.set("turnstilePass", { solvedAt: Date.now() });
    } catch (error) {
      this.logger.warn("Failed to store the security pass:", error.message);
    }
  }
}
