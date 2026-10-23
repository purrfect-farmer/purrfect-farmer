import { PAGE_URL } from "./constants.js";
import DiggoApi from "./DiggoApi.js";

/** The game state and what it says is open */
export default class DiggoState extends DiggoApi {
  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Re-read the game state */
  async loadState() {
    await this.fetchState();
    await this.reportBrowserSignals();
    return this.state_data;
  }

  /** The DEX transition flags, from the state or the public endpoint */
  async getTransition() {
    if (this.state_data?.["transition"]) return this.state_data["transition"];

    return (this.transition ||= (await this.fetchDexTransition())[
      "transition"
    ]);
  }

  /** Why the market is closed, or null when it is open */
  async getMarketPause() {
    const transition = (await this.getTransition()) || {};

    return (transition["marketPaused"] ?? transition["paused"])
      ? "The market is paused for the DEX transition, buy on STON.fi instead."
      : null;
  }

  /** Why deposits are closed, or null when they are open */
  async getDepositPause() {
    const transition = (await this.getTransition()) || {};

    return (transition["depositsPaused"] ?? transition["paused"])
      ? "Deposits are paused for the DEX transition."
      : null;
  }

  /* --------------------------------------------------------------------- */
  /* Risk challenge                                                        */
  /* --------------------------------------------------------------------- */

  /** Solve the Turnstile the backend asks for before new withdrawals */
  async solveRiskChallenge() {
    if (!this.canSolveTurnstile()) {
      throw new Error("A security check is required, but no captcha solver");
    }

    const challenge = await this.startRiskChallenge();

    if (!challenge["required"]) return;

    this.logger.info("Solving the security check...");

    const token = await this.solveTurnstile({
      siteKey: challenge["siteKey"],
      pageUrl: PAGE_URL,
      action: challenge["action"],
      cData: challenge["challengeId"],
    });

    await this.verifyRiskChallenge(challenge["challengeId"], token);
    await this.fetchState();

    this.logger.success("Security check passed.");
  }

  /** Clear a challenge the state already asks for */
  async clearRiskChallenge() {
    if (!this.state_data?.["riskChallenge"]?.["required"]) {
      this.logger.info("No security check pending.");
      return;
    }

    await this.solveRiskChallenge();
  }

  /** Read the state once, for tools that run without a full pass */
  async ensureStateLoaded() {
    if (!this.state_data) {
      await this.setAuth();
      await this.loadState();
    }

    return this.state_data;
  }

  /** The backend's clock, which every timer in the state is measured against */
  getServerNow() {
    return Number(this.state_data?.["serverNow"]) || Date.now();
  }

  /** Get Referrals Count */
  getReferralsCount() {
    return this.state_data?.["friends"]?.["registeredCount"] || 0;
  }
}
