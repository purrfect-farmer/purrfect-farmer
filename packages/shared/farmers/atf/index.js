import BaseFarmer from "../../lib/BaseFarmer.js";
import applyTraits from "../../lib/applyTraits.js";
import { createContext } from "./context.js";
import ATFSession from "./ATFSession.js";
import ATFApi from "./ATFApi.js";
import ATFActivity from "./ATFActivity.js";
import ATFWallet from "./ATFWallet.js";
import ATFWithdrawal from "./ATFWithdrawal.js";
import ATFMining from "./ATFMining.js";
import ATFTasks from "./ATFTasks.js";
import ATFAccount from "./ATFAccount.js";
import ATFTools from "./ATFTools.js";

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

  /** Collaborators the traits work through */
  ctx = createContext(this);

  /** Process Farmer */
  async process() {
    await this.login();

    try {
      await this.executeTask("Presence", () => this.syncPresence());
      await this.logUserInfo(this.user_data.user);
      await this.executeTask("Daily Interaction", () =>
        this.recordDailyInteraction(),
      );
      await this.executeTask("Tap", () => this.tapV2());
      await this.executeTask("Mining", () => this.startOrClaimMining());
      await this.executeTask("Boost", () => this.applyBoost());
      await this.executeTask("Tasks", () => this.completeTasks());
      await this.executeTask("Extra Tasks", () => this.completeExtraTasks());
      await this.executeTask("Bio Task", () => this.completeBioTask());
      await this.executeTask("Name Eye Task", () => this.completeNameEyeTask());
      await this.executeTask("Friends", () => this.claimFriendsRewards());
      await this.executeTask("Withdraw", () => this.withdraw());
      await this.storeAutoSnapshot();
    } finally {
      await this.sendForegroundHidden();
    }
  }
}

applyTraits(ATFFarmer, [
  ATFSession,
  ATFApi,
  ATFActivity,
  ATFWallet,
  ATFWithdrawal,
  ATFMining,
  ATFTasks,
  ATFAccount,
  ATFTools,
]);
