import BaseFarmer from "../lib/BaseFarmer.js";

export default class VCoinFarmer extends BaseFarmer {
  static id = "v-coin";
  static title = "V-Coin";
  static emoji = "👛";
  static host = "www.vcointg.top";
  static domains = ["www.vcointg.top"];
  static telegramLink =
    "https://t.me/VCNFT_bot/VCOIN_NFT?startapp=ref_6335111_QIj5nnLW";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  configureApi() {
    this.api.defaults.headers.common["tenant-id"] = "6335111";
  }

  /** Get Referral Link */
  getReferralLink(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/bot/inviteLink", { signal })
      .then((res) => res.data.data);
  }

  /** Get Auth */
  fetchAuth(signal = this.signal) {
    const referralCode = this.getStartParam()?.split("_")?.at(-1) || "";

    return this.api
      .post(
        "https://www.vcointg.top/app-api/member/auth/tg-login",
        {
          miniId: this.getUserId(),
          username: this.getUsername() || "",
          avatar: "",
          password: "0027rootss",
          referralCode,
          initData: this.getInitData(),
        },
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.accessToken}`,
    };
  }

  async process() {
    const user = await this.getUser();
    const asset = await this.getAsset();
    const mining = await this.getMining();

    this.logUserInfo(user, asset, mining);

    await this.startOrClaimMining(mining);
    await this.spinWheel();
    await this.completeTasks();
    await this.upgradeUserLevel();
  }

  logUserInfo(user, asset, mining) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Level", user.level);
    this.logger.keyValue("V-Coin", asset.usdn / Math.pow(10, 2));
    this.logger.keyValue("USDT", asset.usdt / Math.pow(10, 6));
    this.logger.keyValue(
      "Mining Status",
      mining.status === 0
        ? "Not Started"
        : mining.status === 1
        ? "Mining"
        : "Claimed"
    );
  }

  getMining(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/user/mining/info", { signal })
      .then((res) => res.data.data);
  }

  startMining(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/user/mining/start", { signal })
      .then((res) => res.data.data);
  }

  claimMining(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/user/mining/claim", { signal })
      .then((res) => res.data.data);
  }

  async startOrClaimMining(mining) {
    return this.executeTask("Start or Claim Mining", async () => {
      if (mining.status === 0) {
        await this.startMining();
      } else if (mining.status === 2) {
        await this.claimMining();
      }
    });
  }

  getWheel(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/activity/wheel", { signal })
      .then((res) => res.data.data);
  }

  drawWheel(id, payJson, signal = this.signal) {
    return this.api
      .post(
        "https://www.vcointg.top/app-api/activity/wheel/draw",
        { actId: id, payJson },
        { signal }
      )
      .then((res) => res.data.data);
  }

  async spinWheel() {
    return this.executeTask("Spin Wheel", async () => {
      while (true) {
        const wheel = await this.getWheel();

        if (this.signal?.aborted) {
          this.logger.warn("Wheel spinning aborted");
          return;
        }

        if (wheel.availableNum > 0) {
          this.logger.log("Spinning the wheel...");
          await this.drawWheel(wheel.id, wheel.payJson);
          this.logger.success("Spun the wheel");
        } else {
          this.logger.warn("No spins available for the wheel");
          return;
        }
      }
    });
  }

  getTasks(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/task/list", { signal })
      .then((res) => res.data.data);
  }

  doneTask(id, signal = this.signal) {
    return this.api
      .post(
        `https://www.vcointg.top/app-api/task/done?id=${id}`,
        {},
        { signal }
      )
      .then((res) => res.data.data);
  }

  async completeTasks() {
    return this.executeTask("Complete Tasks", async () => {
      const tasks = await this.getTasks();

      const available = tasks.filter((item) => !item.isDone);

      for (const task of available) {
        try {
          await this.doneTask(task.id);
        } catch (e) {
          this.logger.error(e);
        }
      }
    });
  }

  getUser(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/user/info", { signal })
      .then((res) => res.data.data);
  }

  getAsset(signal = this.signal) {
    return this.api
      .get("https://www.vcointg.top/app-api/asset/info", { signal })
      .then((res) => res.data.data);
  }

  async upgradeUserLevel() {
    return this.executeTask("Upgrade User Level", async () => {
      const levels = await this.getLevelList();
      const user = await this.getUser();

      const asset = await this.getAsset();

      let currentLevel = user.level;
      let balance = asset.usdn;

      while (true) {
        const nextLevel = levels.find(
          (item) => item.level === currentLevel + 1 && item.price >= balance
        );

        if (nextLevel) {
          currentLevel = nextLevel.level;
          balance -= nextLevel.price;

          await this.upgradeLevel(nextLevel.level);
        } else {
          break;
        }
      }
    });
  }

  async getCombinationActivity() {
    return await this.api
      .get("https://www.vcointg.top/app-api/activity/getCombinationActivity")
      .then((res) => res.data.data);
  }

  async getCombinationPage() {
    return await this.api
      .get("https://www.vcointg.top/app-api/combinationActivity/page")
      .then((res) => res.data.data);
  }

  async getCombinationDetail(id) {
    return await this.api
      .post(
        `https://www.vcointg.top/app-api/combinationActivity/detail?id=${id}`,
        {}
      )
      .then((res) => res.data.data);
  }

  async getPackageList() {
    return await this.api
      .get("https://www.vcointg.top/app-api/service/package/list")
      .then((res) => res.data.data);
  }

  async getLevelList() {
    return await this.api
      .get("https://www.vcointg.top/app-api/user/level/list")
      .then((res) => res.data.data);
  }

  async upgradeLevel(level) {
    return await this.api
      .post("https://www.vcointg.top/app-api/user/level/upgrade", { level })
      .then((res) => res.data.data);
  }
}
