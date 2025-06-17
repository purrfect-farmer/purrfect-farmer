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
    /** Tasks */
    const completedTasks = await this.getCompletedUserTasks();
    const userTasks = await this.getUserTasks();

    const availableTasks = userTasks.filter(
      (task) =>
        !completedTasks.some(
          (completedTask) => completedTask["taskId"] === task["_id"]
        )
    );

    const userAds = await this.api
      .get(this.path("https://st-ba-drive.stringdrive.io/api/auth/getUserads"))
      .then((res) => res.data.data);

    for (const ad of userAds) {
      await this.completeUserAd(ad["_id"]);
      await utils.delayForSeconds(20);
    }

    for (const task of availableTasks) {
      await this.tryToJoinTelegramLink(task["Sitelink"]);
      await this.completeUserTask(task["_id"]);
      await utils.delayForSeconds(20);
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
        {
          AdId,
        }
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
      .then((res) => res.data);
  }

  async getCompletedUserTasks() {
    return await this.api
      .get(
        this.path(
          "https://st-ba-drive.stringdrive.io/api/auth/getCompletedTasks"
        )
      )
      .then((res) => res.data.completedTasks);
  }

  async getProfile() {
    return await this.api
      .get(this.path("https://st-ba-drive.stringdrive.io/api/auth/getprofile"))
      .then((res) => res.data);
  }

  path(path) {
    return `${path}/${this.auth.user.id}`;
  }
};
