import { MINIMUM_WITHDRAWAL } from "./constants.js";
import MonsterlandAccount from "./MonsterlandAccount.js";

export default class MonsterlandFarmer extends MonsterlandAccount {
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

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.loadState();

    this.logAccountInfo();

    await this.executeTask("Streak", () => this.claimStreak());
    await this.executeTask("Referrals", () => this.claimReferrals());
    await this.executeTask("Eggs", () => this.manageEggs());
    await this.executeTask("Care", () => this.careForMonsters());
    await this.executeTask("Level", () => this.levelUpMonsters());
    await this.executeTask("Grow", () => this.growFarm());
    await this.executeTask("Missions", () => this.completeMissions());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /* --------------------------------------------------------------------- */
  /* Tools (manual actions)                                                */
  /* --------------------------------------------------------------------- */

  createTools() {
    return [
      {
        name: "Wallet",
        list: this.createAutoWalletTools(),
      },
    ];
  }
}
