import BaseFarmer from "../../lib/BaseFarmer.js";
import { createContext } from "./context.js";
import { MINIMUM_WITHDRAWAL, MRG_JETTON_ADDRESS } from "./constants.js";

export default class MRGFarmer extends BaseFarmer {
  static id = "mrg";
  static title = "MRG";
  static emoji = "⛏️";
  static host = "app.mrgtoken.xyz";
  static domains = ["app.mrgtoken.xyz", "mrg.up.railway.app"];
  static telegramLink = "https://t.me/mrgminerbot/app?startapp=ref_T90OGL9E";
  static path = "/";
  static interval = "0 */3 * * *";
  static apiDelay = 500;
  static rating = 5;
  static published = true;
  static auto = {
    id: "mrg-auto",
    title: "MRG Auto",
    token: "MRG",
    jettonAddress: MRG_JETTON_ADDRESS,
    storagePrefix: "mrg-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
    connectWithPhrase: true,
    verifiable: true,
  };

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { session, account, humanCheck, mining, tasks } = this.ctx;

    await session.login();
    await session.updatePresence(true);

    await account.logInfo();
    await this.executeTask("Human Check", () => humanCheck.ensure());
    await this.executeTask("Check-In", () => mining.checkInDaily());
    await this.executeTask("Level", () => mining.unlockAffordableLevel());
    await this.executeTask("Mining", () => mining.claimPendingMining());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Squad", () => tasks.claimSquadRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
    await session.updatePresence(false);
  }

  /* --------------------------------------------------------------------- */
  /* Host hooks                                                            */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on the drop's own API calls */
  configureApi() {
    return this.ctx.api.configure();
  }

  /** Get Auth */
  fetchAuth() {
    return this.ctx.api.verifyAccount();
  }

  /** Get Meta */
  fetchMeta() {
    return this.ctx.state.load();
  }

  /** Load data */
  async load() {
    await this.ctx.walletVersion.load();
    await this.ctx.humanCheck.restore();
    await this.ctx.tasks.load();
    this.ctx.nft.reset();
  }

  /** Persist data */
  persist() {
    return this.ctx.tasks.persist();
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
