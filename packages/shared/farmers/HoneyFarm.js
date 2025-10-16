import BaseFarmer from "../lib/BaseFarmer.js";

export default class HoneyFarmFarmer extends BaseFarmer {
  static id = "honey-farm";
  static title = "Honey Farm";
  static emoji = "🐻";
  static host = "honey.masha.place";
  static domains = ["honey.masha.place"];
  static telegramLink = "https://t.me/mashabear_honey_bot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  configureApi() {
    /** Inject User ID into all requests */
    const userIdInterceptor = this.api.interceptors.request.use((config) => {
      config.url = this.updateUrl(config.url);
      return config;
    });

    /** Cast data types */
    const dataCastInterceptor = this.api.interceptors.response.use((res) => {
      if (res.data) {
        res.data = this.deepCast(res.data);
      }

      return res;
    });

    return () => {
      this.api.interceptors.request.eject(userIdInterceptor);
      this.api.interceptors.response.eject(dataCastInterceptor);
    };
  }

  autoType(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value === "undefined") return undefined;
    if (value !== "" && !isNaN(value)) return Number(value);
    return value;
  }

  deepCast(data) {
    if (Array.isArray(data)) {
      return data.map(this.deepCast.bind(this));
    } else if (data && typeof data === "object") {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, this.deepCast(v)])
      );
    } else if (typeof data === "string") {
      return this.autoType(data);
    }
    return data;
  }

  updateUrl(url) {
    const urlObj = new URL(url);
    urlObj.searchParams.set("user-id", this.getUserId());

    return urlObj.toString();
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/mashabear_honey_bot?start=${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return { auth: this.telegramWebApp.initData };
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.auth,
    };
  }

  /** Get User */
  getUserInfo(latest = true, signal = this.signal) {
    return this.api
      .get(`https://honey.masha.place/api/v1/user/info/?a=${latest}`, {
        signal,
      })
      .then((res) => res.data);
  }

  getGameplay(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/content/gameplay/", { signal })
      .then((res) => res.data);
  }

  getTasks(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/tasks/", { signal })
      .then((res) => res.data.data);
  }

  getDailyBonusStatus(signal = this.signal) {
    return this.api
      .get(
        "https://honey.masha.place/api/v1/user/bonus/daily/status/?lang=en",
        { signal }
      )
      .then((res) => res.data);
  }

  getDailyBonus(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/bonus/daily/?lang=en", { signal })
      .then((res) => res.data);
  }

  claimDailyBonus(signal = this.signal) {
    return this.api
      .post(
        "https://honey.masha.place/api/v1/user/bonus/daily/update/",
        new URLSearchParams({
          ["lang"]: "en",
          ["user-id"]: this.getUserId(),
        }),
        { signal }
      )
      .then((res) => res.data);
  }

  getUserBoosts(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/boosts/", { signal })
      .then((res) => res.data);
  }

  getBoosts(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/boosts/", { signal })
      .then((res) => res.data.data);
  }

  getFriends(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/friends/", { signal })
      .then((res) => res.data);
  }

  getPromoCode(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/partner/promocode/?lang=en", {
        signal,
      })
      .then((res) => res.data);
  }

  putBoost(boostId, signal = this.signal) {
    return this.api
      .post(
        "https://honey.masha.place/api/v1/user/boosts/",
        { boostId },
        { signal }
      )
      .then((res) => res.data.data);
  }

  putHoney(payload, signal = this.signal) {
    return this.api
      .post(
        "https://honey.masha.place/api/v1/user/transactions/put/",
        payload,
        { signal }
      )
      .then((res) => res.data);
  }

  activateBoost(userBoostId, signal = this.signal) {
    return this.api
      .get(
        `https://honey.masha.place/api/v1/user/boosts/?user-boost-id=${userBoostId}`,
        { signal }
      )
      .then((res) => res.data);
  }

  updateUser(payload, signal = this.signal) {
    return this.api
      .post("https://honey.masha.place/api/v1/user/update/", payload, {
        signal,
      })
      .then((res) => res.data);
  }

  claimTask(taskId, signal = this.signal) {
    return this.api
      .post(
        `https://honey.masha.place/api/v1/user/tasks/claim/?task-id=${taskId}`,
        null,
        { signal }
      )
      .then((res) => res.data.data);
  }

  claimPromoCode(promocode, signal = this.signal) {
    return this.api
      .post(
        "https://honey.masha.place/api/v1/user/promocode/",
        new URLSearchParams({
          ["user-id"]: this.getUserId(),
          ["lang"]: "en",
          ["promocode"]: promocode,
        }),
        { signal }
      )
      .then((res) => res.data);
  }

  patchBoost(userBoostId, status = "active", signal = this.signal) {
    return this.api
      .post(
        `https://honey.masha.place/api/v1/user/boosts/patch/?user-boost-id=${userBoostId}`,
        { status },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const userInfo = await this.getUserInfo();

    this.logUserInfo(userInfo);

    await this.executeTask("Collect Daily Bonus", () =>
      this.collectDailyBonus()
    );
    await this.executeTask("Collect Promo Code", () => this.collectPromoCode());
    await this.executeTask("Complete Tasks", () => this.completeTasks());
    await this.executeTask("Purchase Worker", () => this.purchaseWorker());
    await this.executeTask("Purchase Assistant", () =>
      this.purchaseAssistant()
    );
  }

  logUserInfo(userInfo) {
    const { user } = userInfo;
    const lastTransaction = userInfo["last-transaction"];

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user["max-account-honey"]);
    this.logger.keyValue("Energy", lastTransaction["barrel-honey"]);
  }

  async completeTasks() {
    const tasks = await this.getTasks();
    const unclaimedTasks = tasks.filter(
      (task) => task.status === "pending" && task.currentScore >= task.goalScore
    );

    for (const task of unclaimedTasks) {
      await this.claimTask(task.id);
      this.logger.success(`Claimed Task: ${task.title}`);
    }
  }

  async purchaseWorker() {
    const userInfo = await this.getUserInfo();
    const gameplay = await this.getGameplay();

    let earnPerTap = 0;
    let earnPerHour = 0;

    const newSkills = userInfo.skills.map((skill) => {
      const skillDefault = gameplay.equipment.find(
        (item) => item["equipment-id"] === skill["equipment-id"]
      );
      const skillMaxLevel = Math.max(
        ...Object.keys(skillDefault.levels).map(Number)
      );
      const skillNewLevel = Math.min(skill["level-number"] + 1, skillMaxLevel);
      const skillLevelInfo = skillDefault.levels[skillNewLevel];

      earnPerTap += skillLevelInfo["profit"] || 0;

      return {
        ...skill,
        "level-number": skillNewLevel,
        delay: skillLevelInfo["time-delay"],
      };
    });

    const workerDefault = gameplay.equipment.find(
      (item) => item["equipment-id"] === "worker-default"
    );

    const workerMaxLevel = Math.max(
      ...Object.keys(workerDefault.levels).map(Number)
    );

    const newWorkers = userInfo.workers.map((worker) => {
      if (worker["equipment-id"]) {
        const newWorkerLevel = Math.min(
          worker["level-number"] + 1,
          workerMaxLevel
        );
        const workerLevelInfo = workerDefault.levels[newWorkerLevel];

        earnPerHour += workerLevelInfo["profit"] || 0;

        return {
          ...worker,
          "level-number": newWorkerLevel,
          delay: workerLevelInfo["time-delay"],
        };
      } else {
        const workerLevelInfo = workerDefault.levels[1];

        earnPerHour += workerLevelInfo["profit"] || 0;

        return {
          ...worker,
          "equipment-id": "worker-default",
          "level-number": 1,
          delay: 0,
        };
      }
    });

    const lastTransaction = userInfo["last-transaction"];

    const newLastTransaction = {
      ...lastTransaction,
      "earn-per-tap": earnPerTap,
      "earn-per-hour": earnPerHour,
    };

    const payload = {
      ...userInfo,
      "last-transaction": newLastTransaction,
      skills: newSkills,
      workers: newWorkers,
    };

    await this.updateUser(payload);
    this.logger.success("Purchased/Upgraded Worker");
  }

  async collectDailyBonus() {
    const status = await this.getDailyBonusStatus();
    await this.getDailyBonus();

    if (!status.isCollected) {
      await this.claimDailyBonus();
      this.logger.success("Collected Daily Bonus");
    } else {
      this.logger.info("Daily Bonus already collected");
    }
  }

  async collectPromoCode() {
    const list = await this.getPromoCode();

    if (!list.length) {
      this.logger.info("No promo codes available");
      return;
    }

    for (const item of list) {
      const code = item.title.split(" ").at(-1);
      try {
        await this.claimPromoCode(code);
        this.logger.success(`Claimed promo code: ${code}`);
      } catch (err) {
        this.logger.error(`Failed to claim promo code ${code}: ${err.message}`);
        continue;
      }
    }
  }

  async purchaseAssistant() {
    const userInfo = await this.getUserInfo();
    const gameplay = await this.getGameplay();

    const lastTransaction = userInfo["last-transaction"];

    if (
      !lastTransaction["assistant-id"] ||
      lastTransaction["assistant-status"] !== true
    ) {
      const assistant = gameplay["assistants"].at(-1);

      const currentTime = Math.floor(Date.now() / 1000);
      const newLastTransaction = { ...lastTransaction };

      newLastTransaction["assistant-id"] = assistant["assistant-id"];
      newLastTransaction["assistant-status"] = "true";
      newLastTransaction["assistant-time-start"] = currentTime;
      newLastTransaction["assistant-time-end"] =
        currentTime + assistant["duration"];

      await this.updateUser({
        ...userInfo,
        "last-transaction": newLastTransaction,
      });
    }
  }

  async applyBoost(signal = this.signal) {
    const userBoosts = await this.getUserBoosts();
    const boosts = await this.getBoosts();

    const available = userBoosts.boosted.find((item) => !item.activated);
    if (available) {
      const boost = boosts.find((b) => b.id === available.boostId);
      if (boost.current > 0) {
        const { id } = await this.putBoost(available.boostId);
        await this.utils.delayForSeconds(10, { signal });
        await this.activateBoost(id);
        this.logger.success(`Applied Boost`);
      }
    }
  }
}
