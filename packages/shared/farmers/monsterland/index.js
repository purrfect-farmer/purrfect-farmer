import BaseFarmer from "../../lib/BaseFarmer.js";
import { createContext } from "./context.js";
import { MINIMUM_WITHDRAWAL } from "./constants.js";

export default class MonsterlandFarmer extends BaseFarmer {
  static id = "monsterland";
  static title = "Monsterland";
  static emoji = "👾";
  static host = "lets.playmonsterland.com";
  static domains = [
    "lets.playmonsterland.com",
    "api.adsgram.ai",
    "libtl.com",
    "ill3.com",
    "my.rtmark.net",
    "ad.gigapub.tech",
    "munqu.com",
    "d3rem.com",
    "8rar.com",
    "tads.me",
  ];
  static telegramLink = "https://t.me/monsterland_bot?startapp=ref_DBVMp4B";
  static path = "/";
  static interval = "0 */3 * * *";
  static apiDelay = 500;
  static rating = 4;

  /** The security pass may ride on a cookie, so keep the jar across runs */
  static cookies = true;

  /** Payouts are native TON (the game calls it GRAM), so the Auto has no jetton */
  static auto = {
    id: "monsterland-auto",
    title: "Monsterland Auto",
    token: "TON",
    currency: "LUMIS",
    jettonAddress: null,
    storagePrefix: "monsterland-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
  };

  /** The modules the farmer works through */
  ctx = createContext(this.core);

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    const { state, account, rewards, eggs, care, growth } = this.ctx;

    await state.load();

    account.logInfo();

    await this.connectStoredAutoWallet();
    await this.executeTask("Streak", () => rewards.claimStreak());
    await this.executeTask("Referrals", () => rewards.claimReferrals());
    await this.executeTask("Eggs", () => eggs.manageEggs());
    await this.executeTask("Care", () => care.careForMonsters());
    await this.executeTask("Level", () => growth.levelUpMonsters());
    await this.executeTask("Grow", () => growth.growFarm());
    await this.executeTask("Missions", () => rewards.completeMissions());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /* --------------------------------------------------------------------- */
  /* Host hooks                                                            */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on the game's own API calls */
  configureApi() {
    return this.ctx.api.configure();
  }

  /** Get Auth */
  fetchAuth() {
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
