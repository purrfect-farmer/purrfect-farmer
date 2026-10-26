import BaseFarmer from "../../lib/BaseFarmer.js";
import { createContext } from "./context.js";
import {
  MINIMUM_WITHDRAWAL,
  PXE_JETTON_ADDRESS,
  PXE_TOKEN,
} from "./constants.js";

export default class PickaxeFarmer extends BaseFarmer {
  static id = "pickaxe";
  static title = "Pickaxe Empire";
  static emoji = "⛏️";
  static host = "app.pickaxeempire.com";
  static domains = ["app.pickaxeempire.com", "pxe.up.railway.app"];
  static telegramLink =
    "https://t.me/PickaxeEmpireApp/app?startapp=r_NlUe6stXfHFH";
  static path = "/";
  static interval = "0 */6 * * *";
  static apiDelay = 500;
  static published = true;

  /** PXE is withdrawn on-chain; mining opens once the linked wallet pays for the Ancient Pass, which Verify does */
  static auto = {
    id: "pickaxe-auto",
    title: "Pickaxe Auto",
    token: PXE_TOKEN,
    jettonAddress: PXE_JETTON_ADDRESS,
    storagePrefix: "pickaxe-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
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
    const { state, account, mining, tasks } = this.ctx;

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

    await this.executeTask("Check-in", () => tasks.checkIn());
    await this.executeTask("Mining", () => mining.claim());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Friends", () => tasks.claimFriendsReward());
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
