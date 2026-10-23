import BaseFarmer from "../../lib/BaseFarmer.js";
import applyTraits from "../../lib/applyTraits.js";
import DiggoSession from "./DiggoSession.js";
import DiggoApi from "./DiggoApi.js";
import DiggoState from "./DiggoState.js";
import DiggoTasks from "./DiggoTasks.js";
import DiggoWallet from "./DiggoWallet.js";
import DiggoActivation from "./DiggoActivation.js";
import DiggoWithdrawal from "./DiggoWithdrawal.js";
import DiggoMarket from "./DiggoMarket.js";
import DiggoAccount from "./DiggoAccount.js";
import DiggoTools from "./DiggoTools.js";
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

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.loadState();

    this.logAccountInfo();

    await this.executeTask("Security Check", () => this.clearRiskChallenge());
    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Streak", () => this.claimStreak());
    await this.executeTask("Squad", () => this.claimCommission());
    await this.executeTask("Chests", () => this.openChests());
    await this.executeTask("Conversion", () => this.convertTon());
    await this.executeTask("Holding", () => this.refreshHolding());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }
}

applyTraits(DiggoFarmer, [
  DiggoSession,
  DiggoApi,
  DiggoState,
  DiggoTasks,
  DiggoWallet,
  DiggoActivation,
  DiggoWithdrawal,
  DiggoMarket,
  DiggoAccount,
  DiggoTools,
]);
