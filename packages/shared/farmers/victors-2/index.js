import BaseFarmer from "../../lib/BaseFarmer.js";
import { checkTokenContract } from "../../lib/farmer/onChain.js";
import { createContext } from "./context.js";
import auto from "../../autos/victors-2-auto.js";

export default class VictorsCompany2Farmer extends BaseFarmer {
  static id = "victors-2";
  static title = "Victor's Company 2";
  static emoji = "👷";
  static host = "app.victors.company";
  static domains = [
    "app.victors.company",
    "server.victors.company",
    "api.adsgram.ai",
  ];
  static telegramLink =
    "https://t.me/Victors_Company_bot/app?startapp=ref_B7FAF72160";
  static path = "/";
  static interval = "0 */6 * * *";
  static apiDelay = 500;
  static rating = 5;
  static published = true;
  static auto = auto;

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { state, account, mining, tasks, arcade, adWatcher, gifts } =
      this.ctx;

    await state.load();

    account.logInfo();
    checkTokenContract(this.core, state.config()["jettonMaster"]);

    await this.connectStoredAutoWallet();
    await this.executeTask("Tutorial", () => mining.completeTutorialIfNeeded());
    await this.executeTask("Check-in", () => mining.claimCheckIn());
    await this.executeTask("Level", () => mining.unlockAffordableLevel());
    await this.executeTask("Gifts", () => gifts.collect());
    await this.executeTask("Mining", () => mining.claimPendingMining());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Ads", () => adWatcher.completeAds());
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
