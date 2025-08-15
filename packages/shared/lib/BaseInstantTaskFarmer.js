import BaseFarmer from "./BaseFarmer.js";

export default class BaseInstantTaskFarmer extends BaseFarmer {
  static emoji = "👛";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static cookies = true;

  configureApi() {
    this.api.defaults.baseURL = this.constructor.baseURL;
  }

  /** Get Referral Link */
  getReferralLink() {
    const url = new URL(this.constructor.telegramLink);
    url.searchParams.set("startapp", this.getUserId());
    return url.toString();
  }

  getUser(signal = this.signal) {
    return this.api
      .post(
        "/user/check-or-create",
        {
          ...this.getTelegramUser(),
          referral_code: this.getStartParam(),
          webappdata: this.getInitData(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  getHome(signal = this.signal) {
    return this.api
      .get(`/?tgWebAppStartParam=${this.getStartParam()}`, {
        signal,
        headers: { "X-CSRF-TOKEN": this.csrfToken },
      })
      .then((res) => res.data);
  }

  async process() {
    await this.configureCSRF();
    const user = await this.getUser();
    this.logUserInfo(user);

    await this.completeAds(user);
    await this.completeTasks(user);
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Today Ads", user["today_ads"]);
    this.logger.keyValue("Ads Limit", user["ads_limit"]);
  }

  getAdReward(signal = this.signal) {
    return this.api
      .post(
        "/user/reward",
        {
          ["telegram_id"]: this.getUserId(),
          ["webappdata"]: this.getInitData(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  getTasks(signal = this.signal) {
    return this.api
      .post(
        "/user/tasks",
        {
          ["user_id"]: this.getUserId(),
          ["webappdata"]: this.getInitData(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  verifyTask(id, signal = this.signal) {
    return this.api
      .post(
        "/user/task/verify",
        {
          ["task_id"]: id,
          ["telegram_id"]: this.getUserId(),
          ["webappdata"]: this.getInitData(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  async completeAds(user) {
    return this.executeTask("Complete Ads", async () => {
      for (let i = user["today_ads"]; i < user["ads_limit"]; i++) {
        this.logger.warn("Waiting to complete...");
        await this.utils.delayForSeconds(10, { signal: this.signal });
        await this.getAdReward();
        this.logger.success(`✓ Completed Ad ${i + 1}`);
      }
    });
  }

  async completeTasks(user) {
    return this.executeTask("Complete Tasks", async () => {
      const tasks = await this.getTasks();
      if (!tasks || tasks.length === 0) {
        this.logger.warn("No tasks available to complete.");
        return;
      }

      for (const task of tasks) {
        if (task["status"] === "Active") {
          const taskLink = `https://t.me/${task["username"].slice(1)}`;
          await this.tryToJoinTelegramLink(taskLink);
          await this.verifyTask(task["id"]);
          this.logger.success(`✓ Completed Task: ${task["name"]}`);
        } else {
          this.logger.info(`Task ${task["name"]} is already completed.`);
        }
      }
    });
  }

  async configureCSRF() {
    const home = await this.getHome();
    const csrfToken = home.match(/window.csrfToken = ('|")([^'"]+)('|")/);

    if (csrfToken) {
      this.csrfToken = csrfToken[2];
      this.api.defaults.headers.common["x-csrf-token"] = this.csrfToken;
    }
  }
}
