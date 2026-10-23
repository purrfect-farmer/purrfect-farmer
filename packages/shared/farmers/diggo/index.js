import { DIGGO_JETTON_ADDRESS, DIGGO_TOKEN } from "./constants.js";
import DiggoTools from "./DiggoTools.js";

export default class DiggoFarmer extends DiggoTools {
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
