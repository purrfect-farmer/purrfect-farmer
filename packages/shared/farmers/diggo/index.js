import BaseFarmer from "../../lib/BaseFarmer.js";
import { createContext } from "./context.js";
import { DIGGO_JETTON_ADDRESS, DIGGO_TOKEN } from "./constants.js";

export default class DiggoFarmer extends BaseFarmer {
  static id = "diggo";
  static title = "Diggo";
  static emoji = "⛏️";
  static host = "diggo.linkpc.net";
  static domains = ["diggo.linkpc.net", "api.adsgram.ai"];
  static telegramLink =
    "https://t.me/Diggominer_bot?startapp=ref_e70ec2a75dc027b74f24265b";
  static path = "/";
  static interval = "0 */4 * * *";
  static apiDelay = 500;
  static rating = 3;
  static published = true;

  /** DIGGO is a STON.fi jetton, withdrawn on-chain once the wallet pays its activation */
  static auto = {
    id: "diggo-auto",
    title: "Diggo Auto",
    token: DIGGO_TOKEN,
    jettonAddress: DIGGO_JETTON_ADDRESS,
    storagePrefix: "diggo-auto",
    minWithdrawal: 800,
    verifiable: true,
    connectWithPhrase: true,
  };

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { state, account, risk, tasks, wallet } = this.ctx;

    await state.load();

    account.logInfo();

    await this.executeTask("Security Check", () => risk.clear());
    await this.executeTask("Mining", () => tasks.claimPendingMining());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Streak", () => tasks.claimStreak());
    await this.executeTask("Squad", () => tasks.claimCommission());
    await this.executeTask("Chests", () => tasks.openChests());
    await this.executeTask("Conversion", () => wallet.convertTon());
    await this.executeTask("Holding", () => wallet.refreshHolding());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /* --------------------------------------------------------------------- */
  /* Host hooks                                                            */
  /* --------------------------------------------------------------------- */

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return this.ctx.session.getAuthHeaders(data);
  }

  /** Get Auth */
  fetchAuth() {
    return this.ctx.api.authenticate();
  }

  /** Get Meta */
  fetchMeta() {
    return this.ctx.state.load();
  }

  /** Load data */
  async load() {
    await this.ctx.walletVersion.load();
  }

  /** Get Referral Link */
  getReferralLink() {
    return this.ctx.session.getReferralLink();
  }

  /** Get Referrals Count */
  getReferralsCount() {
    return this.ctx.session.getReferralsCount();
  }

  createTools() {
    return this.ctx.tools.create();
  }

  /* --------------------------------------------------------------------- */
  /* Auto contract                                                         */
  /* --------------------------------------------------------------------- */

  connectAutoWallet(wallet) {
    return this.ctx.auto.connectWallet(wallet);
  }

  verifyAutoWallet(wallet) {
    return this.ctx.auto.verifyWallet(wallet);
  }

  refreshAutoState() {
    return this.ctx.auto.refreshState();
  }

  refreshAutoSummary() {
    return this.ctx.auto.refreshSummary();
  }

  startAutoMining() {
    return this.ctx.auto.startMining();
  }

  getAutoSummary() {
    return this.ctx.auto.summary();
  }

  storeAutoSnapshot() {
    return this.ctx.snapshot.store();
  }

  readAutoWithdrawals() {
    return this.ctx.snapshot.readWithdrawals();
  }

  withdraw(options) {
    return this.ctx.flow.withdraw(options);
  }

  hasPendingWithdrawal() {
    return this.ctx.withdrawals.hasPending();
  }
}
