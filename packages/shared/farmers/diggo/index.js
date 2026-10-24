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
    const { state, account, risk, tasks, launch, wallet } = this.ctx;

    await state.load();

    account.logInfo();

    await this.connectStoredAutoWallet();
    await this.executeTask("Security Check", () => risk.clear());
    await this.executeTask("Mining", () => tasks.claimPendingMining());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Launch Quiz", () => launch.completeQuiz());
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
