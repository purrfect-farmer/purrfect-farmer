import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The game state and what it says is open */
export default class DiggoState extends FarmerModule {
  /** The game state, refreshed by every call that returns one */
  data = null;

  /** The DEX transition flags read from the public endpoint */
  transition = null;

  /** Re-read the game state */
  async load() {
    await this.ctx.api.fetchState();
    await this.ctx.browser.reportSignals();
    return this.data;
  }

  /** The DEX transition flags, from the state or the public endpoint */
  async getTransition() {
    if (this.data?.["transition"]) return this.data["transition"];

    return (this.transition ||= (await this.ctx.api.fetchDexTransition())[
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

  /** Read the state once, for tools that run without a full pass */
  async ensureLoaded() {
    if (!this.data) {
      await this.core.setAuth();
      await this.load();
    }

    return this.data;
  }

  /** The backend's clock, which every timer in the state is measured against */
  getServerNow() {
    return Number(this.data?.["serverNow"]) || Date.now();
  }
}
