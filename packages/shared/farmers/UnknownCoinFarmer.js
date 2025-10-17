import BaseFarmer from "../lib/BaseFarmer.js";

export default class UnknownCoinFarmer extends BaseFarmer {
  static id = "unknown-coin";
  static title = "Unknown Coin";
  static emoji = "❓";
  static host = "app.unknown-coin.com";
  static domains = ["app.unknown-coin.com", "api.unknown-coin.com"];
  static telegramLink =
    "https://t.me/coin_unk_bot/app?startapp=MTE0NzI2NTI5MA==";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static apiDelay = 2000;

  static SECRET_KEY = "O0sN7rQcXoG5ylA6UYSQTJbZqYLV9X70PVn3hS86ceS";

  /** Configure API */
  configureApi() {
    /** Sign Request */
    const requestSignatureInterceptor = this.api.interceptors.request.use(
      async (config) => {
        const headers = await this.getSignatureHeaders(config.url);
        config.headers = {
          ...config.headers,
          ...headers,
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        return config;
      }
    );

    return () => {
      this.api.interceptors.request.eject(requestSignatureInterceptor);
    };
  }

  /** Get signature headers */
  async getSignatureHeaders(url) {
    /** Get Current Timestamp */
    const timestamp = Math.floor(Date.now() / 1000);

    /** Get Request Path */
    const path = new URL(url).pathname.replace("/api/", "");

    /** Create Signature */
    const data = `${path}:${timestamp}`;
    const signature = this.utils.sha256Hmac(this.constructor.SECRET_KEY, data);

    return {
      "Init-Data": this.getInitData(),
      "X-Version": "2.0.2",
      "X-Timestamp": timestamp.toString(16),
      "X-Signature": signature,
    };
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/coin_unk_bot/app?startapp=${btoa(this.getUserId())}`;
  }

  /** Get Auth */
  async fetchAuth() {
    /** Get Server Time */
    await this.getServerTime();
    this._userData = await this.getUserInfo();

    return this._userData;
  }

  /** Get Meta */
  async fetchMeta() {
    await this.updateUserMetrics();
    await this.setUnknownCoinUserAgent(this.userAgent || navigator?.userAgent);
    await this.getHappyHours();
    await this.getCurrencyPrice();
    await this.getUserStoryEnergy();
    await this.getUserStoryUSDT();

    return true;
  }

  /** Get Server Time */
  getServerTime(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/time", { signal })
      .then((res) => res.data);
  }

  /** Get Currency Price */
  getCurrencyPrice(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/currencyPrice", { signal })
      .then((res) => res.data);
  }

  /** Get User Story Energy */
  getUserStoryEnergy(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/user/story/energy", { signal })
      .then((res) => res.data);
  }

  /** Get Lottery Tickets */
  getLotteryTickets(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/lottery-tickets", { signal })
      .then((res) => res.data.data);
  }

  /** Add Coins */
  addCoins(amount, signal = this.signal) {
    return this.api
      .post(
        "https://api.unknown-coin.com/api/add-coins",
        { amount },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Claim Lottery Ticket */
  claimLotteryTicket(ticketId, signal = this.signal) {
    return this.api
      .post(
        `https://api.unknown-coin.com/api/lottery-tickets/${ticketId}`,
        null,
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get User Story USDT */
  getUserStoryUSDT(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/user/story/usdt", { signal })
      .then((res) => res.data);
  }

  /** Get User Info */
  getUserInfo(signal = this.signal) {
    return this.api
      .get(
        `https://api.unknown-coin.com/api/userinfo?refId=${
          this.getStartParam() || ""
        }`,
        {
          signal,
        }
      )
      .then((res) => res.data);
  }

  /** Set Unknown Coin User Agent */
  setUnknownCoinUserAgent(userAgent, signal = this.signal) {
    return this.api
      .post(
        "https://api.unknown-coin.com/api/user-agent",
        { ["user_agent"]: userAgent },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Update User Metrics */
  updateUserMetrics(signal = this.signal) {
    return this.api
      .patch(
        "https://api.unknown-coin.com/api/user/updateMetrics",
        { is_bot: false },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Happy Hours */
  getHappyHours(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/happy-hours", { signal })
      .then((res) => res.data);
  }

  /** Get Tasks */
  getTasks(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/tasks", { signal })
      .then((res) => res.data.data);
  }

  /** Claim Task Reward */
  claimTaskReward(name, signal = this.signal) {
    return this.api
      .post("https://api.unknown-coin.com/api/tasks", { name }, { signal })
      .then((res) => res.data);
  }

  /** Add Energy From Ads */
  addEnergyFromAds(type, signal = this.signal) {
    return this.api
      .post(
        "https://api.unknown-coin.com/api/challenges/add-energy-from-ads",
        { type },
        {
          signal,
          ignoreUnauthorizedError: true,
        }
      )
      .then((res) => res.data);
  }

  /** Add Energy */
  addEnergy(amount, signal = this.signal) {
    return this.api
      .post(
        "https://api.unknown-coin.com/api/add-energy",
        { amount },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Add Energy From Shake */
  addEnergyFromShake(amount = 500, signal = this.signal) {
    return this.api
      .post(
        "https://api.unknown-coin.com/api/challenges/shake/add-energy",
        { amount },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Open Loot Box */
  openLootBox(data = [], signal = this.signal) {
    return this.api
      .post("https://api.unknown-coin.com/api/loot-box", { data }, { signal })
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUserInfo();

    this.logUserInfo(user);
    await this.executeTask("Lottery", () => this.completeLottery(user));
    await this.executeTask("Loot Box", () => this.completeLootBox(user));
    await this.executeTask("Ads", () => this.completeAdRewards(user));
    await this.executeTask("Pop It", () => this.completePopIt(user));
    await this.executeTask("Shake", () => this.completeShake(user));
    await this.executeTask("Tasks", () => this.completeTasks(user));
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user.balance);
    this.logger.keyValue("Energy", user["energy_amount"]);
    this.logger.keyValue("Rounds", user["energy_rounds"]);
    this.logger.keyValue("USDT", user["usdt_balance"]);
    this.logger.keyValue("TON", user["ton_balance"]);
    this.logger.keyValue("NOT", user["not_balance"]);
  }

  /**
   * Get Daily Numbers
   *
   * Generates 4 unique random numbers between 1 and 39 based on the current day (UTC).
   *
   * Source Searches: codes, 0x5265c00, 0x3c6ef35f, function aR4()
   *
   * Once located, use debugger to reveal the unobfuscated code, then deobfuscate the code with AI.
   */
  getDailyNumbers() {
    // Use the current day (UTC) as the random seed
    const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);

    // Create a simple deterministic pseudo-random number generator (LCG)
    let state = daysSinceEpoch;
    const nextRandom = () => {
      state = (1664525 * state + 1013904223) % 2 ** 32;
      return state / 2 ** 32;
    };

    // Generate 5 unique numbers between 1 and 39
    const numbers = [];
    while (numbers.length < 5) {
      const value = Math.floor(nextRandom() * 39) + 1;
      if (!numbers.includes(value)) numbers.push(value);
    }

    // Remove the first one and return the remaining 4
    numbers.shift();
    return numbers;
  }

  /** Complete Lottery */
  async completeLottery(user) {
    if (user["lottery_tickets_available"] > 0) {
      const tickets = await this.getLotteryTickets();

      for (const ticket of tickets) {
        if (ticket.status === "available") {
          await this.claimLotteryTicket(ticket.id);
          this.logger.success(`Claimed lottery ticket ${ticket.id}`);
        }
      }
    } else {
      this.logger.info("No lottery tickets available to claim.");
    }

    /* Purchase Lottery Tickets */
    const purchaseAmount = 15_000;

    if (Number(user["energy_amount"]) >= purchaseAmount) {
      await this.addCoins(purchaseAmount);
      this.logger.success(`Added ${purchaseAmount} coins for lottery tickets.`);
    }
  }

  /** Complete Loot Box */
  async completeLootBox(user) {
    if (user["is_loot_box_available"]) {
      const numbers = this.getDailyNumbers();
      await this.openLootBox(numbers);
      this.logger.success(
        `Opened loot box with numbers: ${numbers.join(", ")}`
      );
    } else {
      this.logger.info("Loot box not available to open.");
    }
  }

  async completeAdRewards(user, signal = this.signal) {
    let rewards = 0;

    for (const [category, ads] of Object.entries(user["ads_rewards"])) {
      if (ads["count"] > ads["used"]) {
        try {
          await this.addEnergyFromAds(category);
          this.logger.success(
            `+Energy (${ads["reward"]}) from ${category.toUpperCase()} Ads`
          );

          rewards += ads["reward"];
        } catch (error) {
          this.logger.error(`Failed [${category.toUpperCase()}]`);
        }
        await this.utils.delayForSeconds(10, { signal });
      }
    }

    this.logger.info(`Total +Energy from Ads: ${rewards}`);
  }

  async completePopIt(user, signal = this.signal) {
    for (let i = 0; i < user["energy_rounds"]; i++) {
      const energy = 150 + Math.floor(Math.random() * 50);
      await this.addEnergy(energy);
      this.logger.success(`+${energy} Energy from Pop It`);
      await this.utils.delayForSeconds(10, { signal });
    }
  }

  async completeShake(user) {
    const time = user["timestamp"];
    const nextShake = user["challenges"]["next_shake_round_at"];

    if (time >= nextShake) {
      await this.addEnergyFromShake();
      this.logger.success(`+500 Energy from Shake`);
    }
  }

  async completeTasks(user) {
    const tasks = await this.getTasks();

    for (const task of tasks) {
      if (task.status === "finished") {
        await this.claimTaskReward(task.name);
        this.logger.success(`Claimed task reward: ${task.description}`);
      }
    }
  }
}
