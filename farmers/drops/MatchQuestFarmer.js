const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class MatchQuestFarmer extends BaseFarmer {
  static id = "matchquest";
  static title = "🌾 MatchQuest Farmer";
  static origin = "https://tgapp.matchain.io";

  async setAuth() {
    const initData = this.farmer.initData;
    const initDataUnsafe = this.farmer.initDataUnsafe;

    /** Get Access Token */
    const accessToken = await this.api
      .post("https://tgapp-api.matchain.io/api/tgapp/v1/user/login", {
        ["tg_login_params"]: initData,
        ["uid"]: initDataUnsafe["user"]?.["id"] ?? "",
        ["first_name"]: initDataUnsafe["user"]?.["first_name"] ?? "",
        ["last_name"]: initDataUnsafe["user"]?.["last_name"] ?? "",
        ["user_name"]: initDataUnsafe["user"]?.["username"] ?? "",
      })
      .then((res) => res.data.data.token);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader(accessToken);
  }

  /** Process */
  async process() {
    await this.starOrClaimFarming();
    await this.purchaseDailyBoosts();
    await this.playGame();
  }

  /** Play Game */
  async playGame() {
    const gameRule = await this.api
      .get("https://tgapp-api.matchain.io/api/tgapp/v1/game/rule")
      .then((res) => res.data.data);

    const tickets = gameRule["game_count"];

    if (tickets > 0) {
      const points = utils.extraGamePoints(90);
      const game = await this.api
        .get("https://tgapp-api.matchain.io/api/tgapp/v1/game/play")
        .then((res) => res.data.data);

      await utils.delayForSeconds(30);

      await this.api.post(
        "https://tgapp-api.matchain.io/api/tgapp/v1/game/claim",
        {
          ["game_id"]: game["game_id"],
          ["points"]: points,
        }
      );
    }
  }

  /** Purchase Daily Boost */
  async purchaseDailyBoosts() {
    const uid = this.farmer.account.id;
    const user = await this.api
      .post("https://tgapp-api.matchain.io/api/tgapp/v1/user/profile", { uid })
      .then((res) => res.data.data);

    const dailyTasks = await this.api
      .get("https://tgapp-api.matchain.io/api/tgapp/v1/daily/task/status")
      .then((res) => res.data.data);

    let initialBalance = user["Balance"] / 1000;
    let balance = initialBalance;

    for (const task of dailyTasks) {
      for (let i = task["current_count"]; i < task["task_count"]; i++) {
        if (balance >= task["point"]) {
          try {
            /** Purchase */
            const isSuccess = await this.api
              .post(
                "https://tgapp-api.matchain.io/api/tgapp/v1/daily/task/purchase",
                { uid, type: task["type"] }
              )
              .then((res) => res.data.data);

            if (!isSuccess) break;

            /** Update Balance */
            balance -= task["point"];
          } catch (error) {
            console.error(error);
          }
        }
      }
    }
  }

  /** Start or Claim Farming */
  async starOrClaimFarming() {
    const uid = this.farmer.account.id;
    const rewards = await this.api
      .post("https://tgapp-api.matchain.io/api/tgapp/v1/point/reward", { uid })
      .then((res) => res.data.data);

    if (rewards["reward"] === 0) {
      await this.api.post(
        "https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/farming",
        { uid }
      );
    } else if (
      utils.dateFns.isAfter(
        new Date(),
        new Date(rewards["next_claim_timestamp"])
      )
    ) {
      await this.api.post(
        "https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/claim",
        { uid }
      );
      await this.api.post(
        "https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/farming",
        { uid }
      );
    }
  }
};
