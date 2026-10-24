import BaseFarmer from "../../lib/BaseFarmer.js";
import { checkTokenContract } from "../../lib/farmer/onChain.js";
import { createContext } from "./context.js";
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

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { state, account, mining, tasks, arcade } = this.ctx;

    await state.load();

    account.logInfo();
    checkTokenContract(this.core, state.config()["jettonMaster"]);

    await this.executeTask("Tutorial", () => mining.completeTutorialIfNeeded());
    await this.executeTask("Check-in", () => mining.claimCheckIn());
    await this.executeTask("Level", () => mining.unlockAffordableLevel());
    await this.executeTask("Mining", () => mining.claimPendingMining());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Arcade", () => arcade.playArcade());
    await this.executeTask("Underground", () => arcade.logUnderground());
    await this.executeTask("Squad", () => tasks.claimSquadRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /* --------------------------------------------------------------------- */
  /* Host hooks                                                            */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` and the human pass on the drop's own API calls */
  configureApi() {
    return this.ctx.api.configure();
  }

  /** Get Auth */
  fetchAuth() {
    return this.ctx.session.login();
  }

  /** Load data */
  async load() {
    await super.load();
    await this.ctx.humanPass.restore();
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
