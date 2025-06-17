const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class SpaceAdventureFarmer extends BaseFarmer {
  static id = "space-adventure";
  static title = "🚀 Space Adventure Farmer";
  static origin = "https://space-adventure.online";

  /** Get Headers */
  getExtraHeaders() {
    const cookies = this.jar.getCookiesSync("https://space-adventure.online");
    const xsrf = decodeURIComponent(
      cookies.find((item) => item.key === "XSRF-TOKEN")?.value || ""
    );

    const headers = {
      ["origins"]: "https://space-adventure.online",
      ["x-xsrf-token"]: xsrf,
    };

    headers["x-auth-id"] = this.farmer.initDataUnsafe.user.id;

    const token = this.farmer.headers?.Authorization
      ? this.farmer.headers?.Authorization?.split(" ")[1]
      : "";

    if (token) {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = utils.uuid() + "-" + timestamp;
      const sign = this.getXsrfSign(xsrf, timestamp);
      const signature = utils.sha256(
        `${timestamp}:${timestamp}:${token}:${nonce}:${sign}`
      );

      headers["x-timestamp"] = timestamp;
      headers["x-nonce"] = nonce;
      headers["x-xsrf-sign"] = sign;
      headers["x-signature"] = signature;
    }

    return headers;
  }

  /** Get XSRF Sign */
  getXsrfSign(xsrf, timestamp) {
    const half = Math.floor(xsrf.length / 2);
    const first = xsrf.slice(0, half);
    const second = xsrf.slice(half);

    return utils.sha256(`${first}${timestamp}${second}`);
  }

  /** Fetch CSRF */
  async fetchCSRF() {
    return this.api.get("https://space-adventure.online/sanctum/csrf-cookie");
  }

  async setAuth() {
    /** Fetch CSRF */
    await this.fetchCSRF();

    /** Get Access Token */
    const accessToken = await this.api
      .post(
        "https://space-adventure.online/api/auth/telegram",
        new URLSearchParams(this.farmer.initData)
      )
      .then((res) => res.data.token);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    /** Fetch CSRF */
    await this.fetchCSRF();

    /** Boosts */
    const boosts = await this.api
      .get("https://space-adventure.online/api/boost/get/")
      .then((res) => res.data.list);

    /** Initial Result */
    let result = await this.fetchWithStatus(() =>
      this.api.get("https://space-adventure.online/api/user/get")
    );

    /** Skip Tutorial */
    if (result.status.canSkipTutorial) {
      result = await this.skipTutorial();
    }

    /** Read News */
    if (result.status.canReadNews) {
      result = await this.readNews();
    }

    /** Claim Daily Reward */
    if (result.status.canClaimDailyReward) {
      result = await this.claimDailyReward();
    }

    /** Claim Coins */
    if (result.status.canClaim) {
      result = await this.claimCoins();
    }

    /** Spin */
    if (result.status.canSpin) {
      result = await this.spin();
    }

    /** Buy Shield */
    if (result.status.canBuyShield) {
      result = await this.buyShield(boosts);
    }

    /** Buy Immunity */
    if (result.status.canBuyImmunity) {
      result = await this.buyImmunity(boosts);
    }

    /** Buy Fuel */
    if (result.status.canBuyFuel) {
      result = await this.buyFuel(boosts);
    }

    await this.completeVideoTasks(result);
    await this.upgradeLevel(result, boosts);
  }

  async upgradeLevel(result, boosts) {
    const balance = Number(result.user["balance"]);
    const gems = Number(result.user["gems"]);

    /** Current Level */
    const currentLevel = result.user?.["level_global"] || 0;

    /** Level Boosts */
    const levelBoosts = boosts
      .filter((item) => item["type"] === "level_boost")
      .map((item) => ({
        ...item,
        ["next_level"]: item["level_list"][item["level_current"] + 1],
      }));

    /** Is Same Level */
    const isSameLevel = levelBoosts.every(
      (item) => item["level_current"] === currentLevel
    );

    /** Available Boosts */
    const availableBoosts = levelBoosts.filter(
      (item) =>
        item["next_level"] && this.validateBoostNextLevel(item, balance, gems)
    );

    /** Upgradable Boosts */
    const upgradableBoosts = availableBoosts.filter(
      (item) => isSameLevel || item["level_current"] === currentLevel
    );

    if (upgradableBoosts.length > 0) {
      const item = utils.randomItem(upgradableBoosts);
      const method = item["next_level"]["price_gems"] <= gems ? "gems" : "coin";

      await this.api.post("https://space-adventure.online/api/boost/buy/", {
        id: item.id,
        method,
      });
    }
  }

  validateBoostNextLevel(item, balance, gems) {
    return (
      item["next_level"]["price_coin"] <= balance ||
      item["next_level"]["price_gems"] <= gems
    );
  }

  async completeVideoTasks(result) {
    const tasks = await this.api
      .get("https://space-adventure.online/api/tasks/get?category=sponsors")
      .then((res) => res.data.listActive);

    const videoTasksCount = Number(result.user["video_tasks"]);
    const adsTasks = tasks.find(
      (item) =>
        item.status === "not_completed" && item.title.includes("Watch 3 ads")
    );

    if (adsTasks) {
      for (let i = videoTasksCount; i < 3; i++) {
        await this.makeAdsRequest("tasks_reward");
        await this.api.put(
          "https://space-adventure.online/api/tasks/reward-video/"
        );
      }
    }
  }

  async shopFreeItem(boosts, type) {
    const item = boosts.find((item) => item["single_type"] === type);

    /** Get Ad */
    await this.makeAdsRequest("shop_free_" + type);

    return await this.fetchWithStatus(() =>
      this.api.post("https://space-adventure.online/api/boost/buy/", {
        id: item.id,
        method: "free",
      })
    );
  }

  async buyShield(boosts) {
    return this.shopFreeItem(boosts, "shield");
  }

  async buyImmunity(boosts) {
    return this.shopFreeItem(boosts, "immunity");
  }

  async buyFuel(boosts) {
    return this.shopFreeItem(boosts, "fuel");
  }

  async skipTutorial() {
    return await this.fetchWithStatus(() =>
      this.api.put("https://space-adventure.online/api/user/settings/tutorial/")
    );
  }

  async readNews() {
    return await this.fetchWithStatus(() =>
      this.api.put("https://space-adventure.online/api/user/settings/read-news")
    );
  }

  async claimDailyReward() {
    /** Get Ad */
    await this.makeAdsRequest("daily_activity");

    return await this.fetchWithStatus(() =>
      this.api.post("https://space-adventure.online/api/dayli/claim_activity/")
    );
  }

  async claimCoins() {
    /** Get Ad */
    await this.makeAdsRequest("claim_coins");

    /** Get Captcha */
    const { captchaTrue, captchaList } = await this.api
      .get("https://space-adventure.online/api/game/captcha/")
      .then((res) => res.data);

    /** Solve Captcha */
    await this.api.post("https://space-adventure.online/api/game/captcha/", {
      captcha: captchaList.find((item) => item.img === captchaTrue).value,
    });

    return await this.fetchWithStatus(() =>
      this.api.post("https://space-adventure.online/api/game/claiming/")
    );
  }

  async spin() {
    /** Get Ad */
    await this.makeAdsRequest("spin_roulete");

    return await this.fetchWithStatus(() =>
      this.api.post("https://space-adventure.online/api/roulette/buy/", {
        method: "free",
      })
    );
  }

  async fetchWithStatus(callback) {
    const { user } = await callback().then((res) => res.data);

    return {
      user,
      status: this.getStatus(user),
    };
  }

  async makeAdsRequest(type) {
    if (this.config.watchAds) {
      return this.api.post("https://space-adventure.online/api/user/get_ads/", {
        type,
      });
    }
  }

  getStatus(user) {
    const localeTime = user["locale_time"];
    const timePassed = utils.dateFns.differenceInSeconds(
      user["shield_ended_at"]
        ? new Date(user["shield_ended_at"])
        : new Date(localeTime),
      new Date(user["claimed_last"])
    );

    const lowFuelInSeconds = 10 * 60;
    const fuelEnd = user["fuel_last_at"] + user["fuel"] * 1000;
    const remainingFuelInSeconds = utils.dateFns.differenceInSeconds(
      new Date(fuelEnd),
      new Date(localeTime)
    );

    const unclaimed = user["claim"] * timePassed;

    const canBuyFuel =
      remainingFuelInSeconds <= lowFuelInSeconds &&
      utils.dateFns.isAfter(
        new Date(localeTime),
        new Date(user["fuel_free_at"])
      );

    const canClaim = unclaimed >= user["claim_max"];
    const canBuyShield =
      user["shield_damage"] > 0 &&
      utils.dateFns.isAfter(
        new Date(localeTime),
        new Date(user["shield_free_at"])
      );

    const canBuyImmunity =
      utils.dateFns.isAfter(
        new Date(localeTime),
        new Date(user["shield_immunity_at"])
      ) &&
      utils.dateFns.isAfter(
        new Date(localeTime),
        new Date(user["shield_free_immunity_at"])
      );

    const canSpin = utils.dateFns.isAfter(
      new Date(localeTime),
      new Date(user["spin_after_at"])
    );

    const canSkipTutorial = user["tutorial"] !== true;
    const canReadNews = user["new_post"] !== true;

    const canClaimDailyReward = utils.dateFns.isAfter(
      new Date(localeTime),
      new Date(user["daily_next_at"])
    );

    return {
      unclaimed,
      remainingFuelInSeconds,
      canClaim,
      canBuyFuel,
      canBuyShield,
      canBuyImmunity,
      canSpin,
      canReadNews,
      canSkipTutorial,
      canClaimDailyReward,
    };
  }
};
