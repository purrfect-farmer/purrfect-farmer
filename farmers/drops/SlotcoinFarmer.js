const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class SlotcoinFarmer extends BaseFarmer {
  static id = "slotcoin";
  static title = "🎰 Slotcoin Farmer";
  static origin = "https://app.slotcoin.app";
  static delay = 2;
  static auth = true;

  async setAuth() {
    /** Get Access Token */
    const accessToken = await this.api
      .post("https://api.slotcoin.app/v1/clicker/auth", {
        ["initData"]: this.farmer.initData,
        ["referralCode"]: "a2dd-60f7",
      })
      .then((res) => res.data.accessToken);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader(accessToken);
  }

  async process() {
    const dailyCheckIn = await this.api
      .post("https://api.slotcoin.app/v1/clicker/check-in/info")
      .then((res) => res.data);

    if (dailyCheckIn["time_to_claim"] <= 0) {
      await this.api.post("https://api.slotcoin.app/v1/clicker/check-in/claim");
    }

    const info = await this.api
      .post("https://api.slotcoin.app/v1/clicker/api/info")
      .then((res) => res.data);

    /** Bid */
    const bid = Number(info["user"]["bid"]);

    /** Initial Tickets */
    let tickets = Number(info["user"]["daily_roulette_count"]);

    /** Initial Energy */
    let energy = Number(info["user"]["spins"]);

    while (tickets > 0) {
      /** Subtract Ticket */
      tickets -= 1;

      /** Spin Ticket */
      await this.api.post("https://api.slotcoin.app/v1/clicker/daily/spin");
    }

    while (energy >= bid) {
      /** Subtract Energy */
      energy -= bid;

      /** Spin */
      await this.api.post("https://api.slotcoin.app/v1/clicker/api/spin");
    }
  }
};
