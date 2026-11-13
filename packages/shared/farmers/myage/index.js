import BaseFarmer from "../../lib/BaseFarmer.js";
import { createContext } from "./context.js";
import auto from "../../autos/myage-auto.js";

export default class MyAgeFarmer extends BaseFarmer {
  static id = "myage";
  static title = "My Age";
  static emoji = "⏳";
  static host = "myageapp.xyz";
  static domains = ["myageapp.xyz"];
  static telegramLink = "https://t.me/MyAgeApp?startapp=r1147265290";
  static path = "/";
  static interval = "0 */4 * * *";
  static apiDelay = 500;
  static published = true;

  /** Payouts are native TON (the drop calls it GRAM), so the Auto has no jetton */
  static auto = auto;

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { state, account, rewards, tasks, profile } = this.ctx;

    await state.load();

    if (state.isPlayable()) {
      await this.connectStoredAutoWallet();
    }

    const reason = state.unplayableReason();

    if (reason) {
      this.logger.warn(reason);
      await this.storeAutoSnapshot();
      return;
    }

    account.logInfo();

    await this.executeTask("Welcome", () => rewards.claimWelcome());
    await this.executeTask("Daily", () => rewards.claimDaily());
    await this.executeTask("Vault", () => rewards.claimVault());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Spin", () => rewards.spinWheel());
    await this.executeTask("Mystery", () => rewards.spinMystery());
    await this.executeTask("Name Tag", () => profile.claimTag());
    await this.executeTask("Bio", () => profile.claimBio());
    await this.executeTask("Withdraw", () => this.withdraw());

    await this.storeAutoSnapshot();
  }

  /* --------------------------------------------------------------------- */
  /* Host hooks                                                            */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on the drop's own API calls */
  configureApi() {
    return this.ctx.api.configure();
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
