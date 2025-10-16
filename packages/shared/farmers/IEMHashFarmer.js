import BaseFarmer from "../lib/BaseFarmer.js";

export default class IEMHashFarmer extends BaseFarmer {
  static id = "iem-hash";
  static title = "IEM Hash";
  static emoji = "👛";
  static host = "app.iemhash.com";
  static domains = ["app.iemhash.com", "appapi.iemhash.com"];
  static telegramLink =
    "https://t.me/IEMHash_bot/Airdrop?startapp=r_1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static interval = "*/5 * * * *";

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/IEMHash_bot/Airdrop?startapp=r_${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return { auth: this.getInitData() };
  }

  /** Get Meta */
  fetchMeta() {
    return this.api
      .post("https://appapi.iemhash.com/api/v1/user/login_9", {
        pid: this.getStartParam(),
        time: Math.floor(Date.now() / 1000),
      })
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.auth,
    };
  }

  getUser(signal = this.signal) {
    return this.api
      .get("https://appapi.iemhash.com/api/v1/user/getuser", { signal })
      .then((res) => res.data.data);
  }

  pingPlanet(signal = this.signal) {
    return this.api
      .get("https://appapi.iemhash.com/api/v1/planet/ping", { signal })
      .then((res) => res.data.data);
  }

  getPlanetAreaList(signal = this.signal) {
    return this.api
      .get("https://appapi.iemhash.com/api/v1/planet/area_list", { signal })
      .then((res) => res.data.data);
  }

  getPlanetDetail(signal = this.signal) {
    return this.api
      .get("https://appapi.iemhash.com/api/v1/planet/detail", { signal })
      .then((res) => res.data.data);
  }

  getTasks(signal = this.signal) {
    return this.api
      .get("https://appapi.iemhash.com/api/v1/task/gettasks", { signal })
      .then((res) => res.data.data);
  }

  doTask(taskId, signal = this.signal) {
    return this.api
      .post(
        "https://appapi.iemhash.com/api/v1/task/dotask",
        {
          ["taskid"]: taskId,
          ["time"]: Math.floor(Date.now() / 1000),
        },
        { signal }
      )
      .then((res) => res.data.data);
  }

  receiveNewUserReward(signal = this.signal) {
    return this.api
      .post("https://appapi.iemhash.com/api/v1/user/receiveNewUser", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  getWeekTask(signal = this.signal) {
    return this.api
      .post("https://appapi.iemhash.com/api/v1/task/week_gettask", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  checkWeekTask(signal = this.signal) {
    return this.api
      .post("https://appapi.iemhash.com/api/v1/task/week_task_check", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  collectWeekTask(signal = this.signal) {
    return this.api
      .post("https://appapi.iemhash.com/api/v1/task/week_task_collect", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  collectAd(signal = this.signal) {
    return this.api
      .get(
        `https://appapi.iemhash.com/api/v1/advertisement/noticetest?userid=${this.getUserId()}`,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Process Farmer */
  async process() {
    const { user } = await this.getUser();

    this.logUserInfo(user);

    await this.claimReward(user);
    await this.completeTasks();
    await this.mine();
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Score", user.score);
    this.logger.keyValue("Power", user.power);
  }

  claimReward(user) {
    return this.executeTask("Claim Reward", async () => {
      const hasClaimedNewUserReward = "mint_token" in user;
      if (!hasClaimedNewUserReward) {
        await this.receiveNewUserReward();
        this.logger.success("Received new user reward!");
      }
    });
  }

  mine(signal = this.signal) {
    return this.executeTask("Mine Planet", async () => {
      while (true) {
        if (this.signal.aborted) return;
        const { user } = await this.getUser();

        if (user.power < 1000) return;

        await this.pingPlanet();
        await this.getPlanetAreaList();
        await this.getPlanetDetail();

        this.logger.success(`Mined successfully! - ${user.power}`);

        await this.utils.delayForSeconds(2, { signal });
      }
    });
  }

  completeTasks(signal = this.signal) {
    return this.executeTask("Complete Tasks", async () => {
      while (true) {
        const weekTask = await this.getWeekTask();

        if (weekTask["down_time"] > 0) {
          return;
        }

        switch (weekTask.type) {
          case "watch_ads":
            const totalCount = weekTask["line"];
            const userCount = weekTask["my_line"];

            for (let i = userCount; i < totalCount; i++) {
              await this.collectAd();
              await this.utils.delayForSeconds(10, { signal });
            }
            break;

          case "join_channel":
          case "join_group":
            const url = `https://t.me/${weekTask.jump}`;
            await this.tryToJoinTelegramLink(url);
            break;

          default:
            return;
        }

        const { data } = await this.checkWeekTask();

        if (data.completed) {
          await this.collectWeekTask();
          this.logger.success(`COMPLETED: ${data.desc}`);
        } else {
          return;
        }
      }
    });
  }
}
