import BaseFarmer from "../../lib/BaseFarmer.js";
import { createContext } from "./context.js";

export default class ATFFarmer extends BaseFarmer {
  static published = true;
  static id = "atf";
  static title = "ATF";
  static emoji = "🪙";
  static host = "atfminers.asloni.online";
  static domains = ["atfminers.asloni.online"];
  static telegramLink = "https://t.me/ATF_AIRDROP_bot?start=8577109758";
  static path = "/miner/index.html";
  static interval = "0 */2 * * *";
  static apiDelay = 500;
  static rating = 5;
  static netRequest = {
    requestHeaders: [
      {
        header: "x-requested-with",
        operation: "set",
        value: "XMLHttpRequest",
      },
    ],
  };
  static auto = {
    id: "atf-auto",
    title: "ATF Auto",
    token: "ATF",
    jettonAddress: "EQANcW45W0Tp91bzvHayaPO6-6hf1Lm4XlWZ4rN6L5ofPWdb",
    storagePrefix: "atf-auto",
    minWithdrawal: 500,
    connectWithPhrase: true,
  };

  /** The drop answers the entry risk challenge with a 403, which the extension would reset the farmer over */
  static RISK_CHALLENGE_CONFIG = { ignoreUnauthorizedError: true };

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /** Process Farmer */
  async process() {
    const { state, session, activity, account, mining, tasks } = this.ctx;

    await session.login();

    try {
      await this.executeTask("Wallet", () =>
        this.ctx.auto.connectStoredWallet(),
      );
      await this.executeTask("Presence", () => activity.syncPresence());
      await account.logUserInfo(state.data.user);
      await this.executeTask("Daily Interaction", () =>
        activity.recordDailyInteraction(),
      );
      await this.executeTask("Tap", () => mining.tapV2());
      await this.executeTask("Mining", () => mining.startOrClaimMining());
      await this.executeTask("Boost", () => mining.applyBoost());
      await this.executeTask("Tasks", () => tasks.completeTasks());
      await this.executeTask("Extra Tasks", () => tasks.completeExtraTasks());
      await this.executeTask("Bio Task", () => tasks.completeBioTask());
      await this.executeTask("Name Eye Task", () =>
        tasks.completeNameEyeTask(),
      );
      await this.executeTask("Friends", () => tasks.claimFriendsRewards());
      await this.executeTask("Withdraw", () => this.withdraw());
      await this.storeAutoSnapshot();
    } finally {
      await activity.sendForegroundHidden();
    }
  }

  /* --------------------------------------------------------------------- */
  /* Host hooks                                                            */
  /* --------------------------------------------------------------------- */

  /** Stamp every request the way the page does */
  configureApi() {
    return this.ctx.session.configure();
  }

  /** Get Auth */
  fetchAuth() {
    return this.ctx.session.login();
  }

  /** Get Auth Headers, with the session token login hands out once it has */
  getAuthHeaders() {
    return this.ctx.session.getAuthHeaders();
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
}
