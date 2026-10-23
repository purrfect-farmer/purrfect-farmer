import BaseFarmer from "../../lib/BaseFarmer.js";
import applyTraits from "../../lib/applyTraits.js";
import VictorsSession from "./VictorsSession.js";
import VictorsApi from "./VictorsApi.js";
import VictorsHumanPass from "./VictorsHumanPass.js";
import VictorsState from "./VictorsState.js";
import VictorsWallet from "./VictorsWallet.js";
import VictorsMining from "./VictorsMining.js";
import VictorsTasks from "./VictorsTasks.js";
import VictorsArcade from "./VictorsArcade.js";
import VictorsWithdrawal from "./VictorsWithdrawal.js";
import VictorsAccount from "./VictorsAccount.js";
import VictorsNft from "./VictorsNft.js";
import VictorsTools from "./VictorsTools.js";
import { MINIMUM_WITHDRAWAL, VIC_JETTON_ADDRESS } from "./constants.js";

export default class VictorsCompanyFarmer extends BaseFarmer {
  static id = "victors";
  static title = "Victor's Company";
  static emoji = "👷";
  static host = "app.victors.company";
  static domains = ["app.victors.company", "server.victors.company"];
  static telegramLink =
    "https://t.me/VictorsCompanybot/app?startapp=ref_6B6CAC6747";
  static path = "/";
  static interval = "0 */6 * * *";
  static apiDelay = 500;
  static rating = 5;
  static published = true;
  static auto = {
    id: "victors-auto",
    title: "Victor's Auto",
    token: "VIC",
    jettonAddress: VIC_JETTON_ADDRESS,
    storagePrefix: "victors-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
    verifiable: true,
  };

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.loadState();

    this.logAccountInfo();
    this.checkTokenContract(this.getConfig()["jettonMaster"]);

    await this.executeTask("Tutorial", () => this.completeTutorialIfNeeded());
    await this.executeTask("Check-in", () => this.claimCheckIn());
    await this.executeTask("Level", () => this.unlockAffordableLevel());
    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Arcade", () => this.playArcade());
    await this.executeTask("Underground", () => this.logUnderground());
    await this.executeTask("Squad", () => this.claimSquadRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }
}

applyTraits(VictorsCompanyFarmer, [
  VictorsSession,
  VictorsApi,
  VictorsHumanPass,
  VictorsState,
  VictorsWallet,
  VictorsMining,
  VictorsTasks,
  VictorsArcade,
  VictorsWithdrawal,
  VictorsAccount,
  VictorsNft,
  VictorsTools,
]);
