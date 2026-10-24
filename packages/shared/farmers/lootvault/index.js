import BaseFarmer from "../../lib/BaseFarmer.js";
import { createContext } from "./context.js";
import {
  LOOT_JETTON_ADDRESS,
  LOOT_TOKEN,
  MINIMUM_WITHDRAWAL,
} from "./constants.js";

export default class LootVaultFarmer extends BaseFarmer {
  static id = "lootvault";
  static title = "LootVault";
  static emoji = "💰";
  static host = "lootvault.lol";
  static domains = ["lootvault.lol"];
  static telegramLink = "https://t.me/LootVaultDexBot?start=ref_1147265290";
  static path = "/";
  static interval = "0 */6 * * *";
  static apiDelay = 500;
  static published = true;
  static auto = {
    id: "lootvault-auto",
    title: "LootVault Auto",
    token: LOOT_TOKEN,
    jettonAddress: LOOT_JETTON_ADDRESS,
    storagePrefix: "lootvault-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
  };

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { state, account, mining, tasks, tower } = this.ctx;

    await state.load();

    /** Connecting a wallet is how an unregistered account registers, which reloads the state */
    if (!state.isBlocked() && !state.isMaintenance()) {
      await this.connectStoredAutoWallet();
    }

    const reason = state.unplayableReason();

    if (reason) {
      this.logger.warn(reason);
      await this.storeAutoSnapshot();
      return;
    }

    account.logInfo();

    await this.executeTask("Mining", () => mining.collect());
    await this.executeTask("Streak", () => tasks.claimStreak());
    await this.executeTask("Tasks", () => tasks.completeTasks());
    await this.executeTask("Tower", () => tower.collect());
    await this.executeTask("Parts", () => tower.equipParts());
    await this.executeTask("Friends", () => tasks.claimFriendsReward());
    await this.executeTask("Withdraw", () => this.withdraw());

    /** Streak, task, tower and friend claims move the balance after the last read */
    await state.loadDashboard();
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
