const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class StringDriveFarmer extends BaseFarmer {
  static id = "string-drive";
  static title = "🚘 String Drive Farmer";
  static origin = "https://st-fr-drive.stringdrive.io";
  static shouldSetAuth = true;

  async setAuth() {
    const initDataUnsafe = this.farmer.initDataUnsafe;

    this.auth = await this.api
      .post("https://st-ba-drive.stringdrive.io/api/auth/userlogin", {
        chatId: initDataUnsafe?.["user"]?.["id"],
        username: initDataUnsafe?.["user"]?.["first_name"] ?? "",
        profilepic: initDataUnsafe?.["user"]?.["photo_url"] ?? "",
        referalId: initDataUnsafe?.["start_param"] ?? "",
      })
      .then((res) => res.data);

    /** Get Access Token */
    const accessToken = this.auth.token;

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    await this.completeTasks();
    await this.completeAds();
    await this.playGame();
  }

  async completeTasks() {
    /** Tasks */
    const completedTasks = await this.getCompletedUserTasks();
    const userTasks = await this.getUserTasks();

    const availableTasks = userTasks.filter(
      (task) =>
        !completedTasks.some(
          (completedTask) => completedTask["taskId"] === task["_id"]
        )
    );

    for (const task of availableTasks) {
      await this.tryToJoinTelegramLink(task["Sitelink"]);
      await this.completeUserTask(task["_id"]);
      await utils.delayForSeconds(20);
    }
  }

  async completeAds() {
    /** Ads */
    const userAds = await this.api
      .get(this.path("https://st-ba-drive.stringdrive.io/api/auth/getUserads"))
      .then((res) => res.data.data);

    const availableAds = userAds;

    for (const ad of availableAds) {
      try {
        await this.completeUserAd(ad["_id"]);
        await utils.delayForSeconds(30);
      } catch (error) {
        console.error(
          "Failed to complete ad:",
          ad,
          error.response?.data?.message || error.message
        );
      }
    }
  }

  async playGame() {
    const gameId = "682c52efdc400a61db731520";
    const game = await this.api
      .get(
        this.path(
          "https://st-ba-drive.stringdrive.io/api/auth/getusersinglegame",
          gameId
        )
      )
      .then((res) => res.data.data);

    const max = Number(game.max);
    const user = await this.getProfile();
    const balance = Number(user.ticketBalance);

    if (balance >= max) {
      const TOTAL_GAMES = 5;
      const LOSE_INDEX = Math.floor(Math.random() * TOTAL_GAMES);

      for (let i = 0; i < TOTAL_GAMES; i++) {
        const isWin = i !== LOSE_INDEX;
        const bet = await this.api
          .post(this.path("https://st-ba-drive.stringdrive.io/api/auth/game"), {
            betAmount: String(max),
            gameId,
          })
          .then((res) => res.data.data);

        const gameHistoryId = bet.gameHistoryId;

        await utils.delayForSeconds(isWin ? 60 : 20);

        await this.api
          .post(this.path("https://st-ba-drive.stringdrive.io/api/auth/game"), {
            gameHistoryId,
            playedStatus: isWin ? "WON" : "LOSE",
            winAmount: utils.extraGamePoints(
              isWin ? max * 2 : Math.floor(max / 2)
            ),
          })
          .then((res) => res.data.data);
      }
    }
  }

  async getUserTasks() {
    return await this.api
      .get(
        this.path("https://st-ba-drive.stringdrive.io/api/auth/getUserTasks")
      )
      .then((res) => res.data.allTasks);
  }

  async completeUserAd(AdId) {
    return await this.api
      .post(
        this.path("https://st-ba-drive.stringdrive.io/api/auth/completeUserAD"),
        { AdId }
      )
      .then((res) => res.data);
  }

  async completeUserTask(taskId) {
    return await this.api
      .post(
        this.path("https://st-ba-drive.stringdrive.io/api/auth/completetask"),
        { taskId }
      )
      .then((res) => res.data);
  }

  async getCompletedUserAds() {
    return await this.api
      .get(
        this.path(
          "https://st-ba-drive.stringdrive.io/api/auth/getUserCompletedAds"
        )
      )
      .then((res) => res.data.completedAds || [])
      .catch(() => []);
  }

  async getCompletedUserTasks() {
    return await this.api
      .get(
        this.path(
          "https://st-ba-drive.stringdrive.io/api/auth/getCompletedTasks"
        )
      )
      .then((res) => res.data.completedTasks || []);
  }

  async getProfile() {
    return await this.api
      .get(this.path("https://st-ba-drive.stringdrive.io/api/auth/getprofile"))
      .then((res) => res.data.user);
  }

  path(path, id) {
    return `${path}/${id || this.auth.user.id}`;
  }
};
