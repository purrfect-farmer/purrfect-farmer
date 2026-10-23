import BaseFarmer from "../../lib/BaseFarmer.js";
import applyTraits from "../../lib/applyTraits.js";
import MRGSession from "./MRGSession.js";
import MRGApi from "./MRGApi.js";
import MRGHumanCheck from "./MRGHumanCheck.js";
import MRGState from "./MRGState.js";
import MRGWallet from "./MRGWallet.js";
import MRGNft from "./MRGNft.js";
import MRGMining from "./MRGMining.js";
import MRGTasks from "./MRGTasks.js";
import MRGWithdrawal from "./MRGWithdrawal.js";
import MRGAccount from "./MRGAccount.js";
import MRGTools from "./MRGTools.js";
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

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.login();
    await this.updatePresence(true);

    await this.logAccountInfo();
    await this.executeTask("Human Check", () => this.ensureHumanCheck());
    await this.executeTask("Check-In", () => this.checkInDaily());
    await this.executeTask("Level", () => this.unlockAffordableLevel());
    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Squad", () => this.claimSquadRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
    await this.updatePresence(false);
  }
}

applyTraits(MRGFarmer, [
  MRGSession,
  MRGApi,
  MRGHumanCheck,
  MRGState,
  MRGWallet,
  MRGNft,
  MRGMining,
  MRGTasks,
  MRGWithdrawal,
  MRGAccount,
  MRGTools,
]);
