import BaseFarmer from "../../lib/BaseFarmer.js";
import { AIRDROP_ENTRY_ENABLED } from "./constants.js";
import { createContext } from "./context.js";

export default class MiaoushiFarmer extends BaseFarmer {
  static id = "miaoushi";
  static title = "Miaoushi";
  static emoji = "🐱";
  static type = "direct";
  static host = "miaoushi.com";
  static domains = ["miaoushi.com"];
  static telegramLink = "https://t.me/miaoushi_airdrop_bot?start=mine";
  static interval = "0 * * * *";
  static published = true;

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { identity, status, entry, mining } = this.ctx;

    if (!this.client) {
      this.logger.warn("Miaoushi needs a logged-in Telegram client");
      return;
    }

    await identity.logInfo();
    await this.executeTask("Mining", () => mining.mine());

    if (!AIRDROP_ENTRY_ENABLED) return;

    await status.load();

    if (!status.isEntered()) {
      await this.executeTask("Entry", () => entry.enter());
      await status.load();
    }

    status.logInfo();
  }

  /* --------------------------------------------------------------------- */
  /* Host hooks                                                            */
  /* --------------------------------------------------------------------- */

  /** Get Referral Link */
  getReferralLink() {
    return this.ctx.mining.getReferralLink();
  }

  /** Get Referrals Count */
  getReferralsCount() {
    return this.ctx.mining.getReferralsCount();
  }

  createTools() {
    return this.ctx.tools.create();
  }
}
