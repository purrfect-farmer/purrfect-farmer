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

  getUserBoosts(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/boosts/", { signal })
      .then((res) => res.data);
  }

  getBoosts(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/boosts/", { signal })
      .then((res) => res.data);
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

  putHoney(payload, signal = this.signal) {
    return this.api
      .post(
        "https://honey.masha.place/api/v1/user/transactions/put/",
        payload,
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
          "user-id": this.getUserId(),
          lang: "en",
          promocode,
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

    await this.getDailyBonusStatus();
    await this.getDailyBonus();
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

    const newSkills = userInfo.skills.map((skill) => {
      const skillDefault = gameplay.equipment.find(
        (item) => item["equipment-id"] === skill["equipment-id"]
      );
      const skillMaxLevel = Math.max(
        ...Object.keys(skillDefault.levels).map(Number)
      );
      const skillNewLevel = Math.min(skill["level-number"] + 1, skillMaxLevel);
      const skillLevelInfo = skillDefault.levels[skillNewLevel];

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
        const newLevel = Math.min(worker["level-number"] + 1, workerMaxLevel);
        const levelInfo = workerDefault.levels[newLevel];
        return {
          ...worker,
          "level-number": newLevel,
          delay: levelInfo["time-delay"],
        };
      } else {
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
      "earn-per-tap": newSkills.reduce(
        (sum, skill) => sum + (skill["profit"] || 0),
        0
      ),
      "earn-per-hour": newWorkers.reduce(
        (sum, worker) => sum + (worker["profit"] || 0),
        0
      ),
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

    if (!lastTransaction["assistant-id"]) {
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
}
