import BaseFarmer from "../lib/BaseFarmer.js";

export default class UltimateShibFarmer extends BaseFarmer {
  static id = "ultimate-shib";
  static title = "Ultimate Shib";
  static emoji = "🦮";
  static host = "botsmother.com";
  static domains = ["botsmother.com"];
  static telegramLink = "https://t.me/ultimateshibbot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static cookies = true;
  static interval = "0 * * * *";

  updateUrl(url, params = {}) {
    return `${url}?${new URLSearchParams({
      initData: this.getInitData(),
      ...params,
    }).toString()}`;
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/ultimateshibbot?start=${this.getUserId()}`;
  }

  /** Get Meta */
  fetchMeta() {
    return this.api
      .get(
        `https://botsmother.com/api/command/MTA1Nw==/ODY5Ng==?tgWebAppStartParam=${this.getStartParam()}`
      )
      .then((res) => res.data);
  }

  getHome(signal = this.signal) {
    return this.api
      .get(
        this.updateUrl("https://botsmother.com/api/command/MTA1Nw==/ODY5Ng=="),
        { signal }
      )
      .then((res) => res.data);
  }

  checkIn(signal = this.signal) {
    return this.api
      .get(
        this.updateUrl("https://botsmother.com/api/command/MTA1Nw==/ODY5OA=="),
        { signal }
      )
      .then((res) => res.data);
  }

  getNumberValue(dom, id) {
    return parseInt(
      dom.querySelector("#" + id).textContent.replace(/,/g, ""),
      10
    );
  }

  async process() {
    /** @type {Document} */
    const dom = this.utils.parseHTML(await this.getHome());
    const checkInButton = dom.querySelector("#checkin-btn");
    const tgTasks = Array.from(
      dom.querySelectorAll("#tg-tasks-section button[data-task-id]")
    ).map((button) => {
      const link = button.previousElementSibling.getAttribute("href");
      const id = parseInt(button.getAttribute("data-task-id"));

      return {
        id,
        link,
      };
    });

    const totalEarning = this.getNumberValue(dom, "total-earning");
    const todayTasks = this.getNumberValue(dom, "today-tasks");
    const hourlyTasks = this.getNumberValue(dom, "hourly-tasks");

    const status = {
      checkIn: !checkInButton.classList.contains("disabled"),
      totalEarning,
      todayTasks,
      hourlyTasks,
      tgTasks,
    };

    this.logUserInfo(status);

    await this.claimCheckIn(status);
    await this.completeTelegramTasks(status);
    await this.completeAds(status);
  }

  logUserInfo(status) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", status.totalEarning);
    this.logger.keyValue("Today Tasks", status.todayTasks);
    this.logger.keyValue("Hourly Tasks", status.hourlyTasks);
  }

  startAd(signal = this.signal) {
    return this.api
      .get(
        this.updateUrl("https://botsmother.com/api/command/MTA1Nw==/ODcwMA=="),
        { signal }
      )
      .then((res) => res.data);
  }

  claimAd(id, signal = this.signal) {
    return this.api
      .get(
        this.updateUrl("https://botsmother.com/api/command/MTA1Nw==/ODcwMQ==", {
          ["task_id"]: id,
        }),
        { signal }
      )
      .then((res) => res.data);
  }

  claimTelegramTask(id, signal = this.signal) {
    return this.api
      .get(
        this.updateUrl("https://botsmother.com/api/command/MTA1Nw==/ODcxMw==", {
          ["task_id"]: id,
        }),
        { signal }
      )
      .then((res) => res.data);
  }

  completeAds(status) {
    return this.executeTask("Complete Ads", async () => {
      for (let i = status.hourlyTasks; i < 10; i++) {
        const ad = await this.startAd();
        this.logger.success(`✓ Started Ad ${i + 1}`);

        this.logger.warn("Waiting to complete...");
        await this.utils.delayForSeconds(10, { signal: this.signal });

        await this.claimAd(ad["task_id"]);
        this.logger.success(`✓ Claimed Ad ${i + 1}`);
      }
    });
  }

  claimCheckIn(status) {
    return this.executeTask("Claim Check In", async () => {
      if (status.checkIn) {
        await this.checkIn();
        this.logger.success("✓ Check In Claimed");
      } else {
        this.logger.warn("Check In already claimed today");
      }
    });
  }

  completeTelegramTasks(status) {
    return this.executeTask("Telegram Tasks", async () => {
      for (const task of status.tgTasks) {
        try {
          await this.tryToJoinTelegramLink(task.link);
          await this.claimTelegramTask(task.id);
          this.logger.success(`✓ Completed Telegram Task ${task.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to complete Telegram Task ${task.id}: ${error.message}`
          );
        }
      }
    });
  }
}
