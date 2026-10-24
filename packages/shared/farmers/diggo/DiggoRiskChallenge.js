import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { PAGE_URL } from "./constants.js";

/** The Turnstile security check the backend asks for before new withdrawals */
export default class DiggoRiskChallenge extends FarmerModule {
  /** Solve the Turnstile the backend asks for before new withdrawals */
  async solve() {
    if (!this.core.captcha.canSolveTurnstile()) {
      throw new Error("A security check is required, but no captcha solver");
    }

    const challenge = await this.ctx.api.startRiskChallenge();

    if (!challenge["required"]) return;

    this.logger.info("Solving the security check...");

    const token = await this.core.captcha.solveTurnstile({
      siteKey: challenge["siteKey"],
      pageUrl: PAGE_URL,
      action: challenge["action"],
      cData: challenge["challengeId"],
    });

    await this.ctx.api.verifyRiskChallenge(challenge["challengeId"], token);
    await this.ctx.api.fetchState();

    this.logger.success("Security check passed.");
  }

  /** Clear a challenge the state already asks for */
  async clear() {
    if (!this.ctx.state.data?.["riskChallenge"]?.["required"]) {
      this.logger.info("No security check pending.");
      return;
    }

    await this.solve();
  }
}
