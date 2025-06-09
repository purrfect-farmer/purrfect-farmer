const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");
const bot = require("../../lib/bot");

module.exports = class GoldEagleFarmer extends BaseFarmer {
  static id = "gold-eagle";
  static title = "🥇 Gold Eagle Farmer";
  static origin = "https://telegram.geagle.online";

  async setAuth() {
    const params = new URLSearchParams({
      tgWebAppData: this.farmer.initData,
      tgWebAppPlatform: "android",
      tgWebAppVersion: "8.4",
    });

    /** Get Access Token */
    const accessToken = await this.api
      .post("https://gold-eagle-api.fly.dev/login/telegram", {
        ["init_data_raw"]: `https://telegram.geagle.online/?tgWebAppStartParam=r_ubdOBYN6KX#${params.toString()}`,
      })
      .then((res) => res.data["access_token"]);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    const progress = await this.getProgress();

    if (progress["energy"] < progress["max_energy"] * 0.2) {
      await this.api.post("https://gold-eagle-api.fly.dev/user/me/refill");
    }

    if (progress["coins_amount"] >= progress["max_coins_amount"]) {
      const tasks = await this.api
        .get("https://gold-eagle-api.fly.dev/task/my/available")
        .then((res) => res.data);

      const hasCompletedTasks = tasks.every(
        (task) => task["task_type"] !== "Sl8" || task["status"] === "Completed"
      );

      if (!hasCompletedTasks) return;

      const boosters = await this.api
        .get("https://gold-eagle-api.fly.dev/boosters")
        .then((res) => res.data);

      const claimBooster = boosters.find(
        (item) => item["booster_type"] === "Claim" && item["level"] > 0
      );

      if (!claimBooster) return;

      await this.claimToSl8();
    }
  }

  getProgress() {
    return this.api
      .get("https://gold-eagle-api.fly.dev/user/me/progress")
      .then((res) => res.data);
  }

  async claimToSl8() {
    const user = await this.api
      .get("https://gold-eagle-api.fly.dev/user/me")
      .then((res) => res.data);

    /** Ensure User is Registered */
    if (user["is_sl8_user"]) {
      const sl8 = await this.api
        .get("https://gold-eagle-api.fly.dev/me/sl8")
        .then((res) => res.data);

      if (sl8["wallet_status"] === "Active") {
        const progress = await this.getProgress();
        const result = await this.api
          .post("https://gold-eagle-api.fly.dev/wallet/claim")
          .then((res) => res.data);

        await this.sendClaimNotification(
          progress["coins_amount"],
          sl8["wallet_address"],
          result["hash"]
        );
      } else if (sl8["wallet_status"] === "Inactive") {
        await this.api.post(
          "https://gold-eagle-api.fly.dev/slate/wallet/activate"
        );
      }
    }
  }

  async sendClaimNotification(amount, address, hash) {
    const formattedAmount = new Intl.NumberFormat().format(amount);
    const addressLink = `https://stellar.expert/explorer/public/account/${address}`;
    const txLink = `https://stellar.expert/explorer/public/tx/${hash}`;

    await bot.sendPrivateMessage(this.farmer.account, [
      `<b>${this.config.title}</b>\n`,
      `<b>🗓️ Date</b>: ${utils.dateFns.format(
        new Date(),
        "yyyy-MM-dd HH:mm:ss"
      )}`,
      `<b>💰 Amount</b>: <a href="${txLink}">${formattedAmount}</a>`,
      `<b>📘 Address</b>: <a href="${addressLink}">${address}</a>`,
      `<b>🧾 Hash</b>: ${hash}`,
      `<a href="${txLink}">View Transaction</a>`,
      `<blockquote><i>Successfully claimed <a href="${txLink}"><b>${formattedAmount} StarDust</b></a> to <a href="${addressLink}"><b>${address}</b></a></i></blockquote>`,
    ]);
  }
};
