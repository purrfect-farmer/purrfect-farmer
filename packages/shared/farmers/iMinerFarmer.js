import BaseFarmer from "../lib/BaseFarmer.js";

export default class iMinerFarmer extends BaseFarmer {
  static id = "i-miner";
  static title = "iMiner";
  static emoji = "🌀";
  static host = "app.iminer.fun";
  static domains = ["app.iminer.fun", "apimain.iminer.fun"];
  static telegramLink =
    "https://t.me/iMiner_bot/mining?startapp=r_Q72zHd28iL5j";
  static cacheAuth = false;

  /** Get Referral Link */
  async getReferralLink() {
    const { referralCode } = await this.getUser();
    return `https://t.me/iMiner_bot/mining?startapp=r_${referralCode}`;
  }

  /** Get Auth */
  fetchAuth() {
    return this.api
      .post("https://apimain.iminer.fun/iapi/server/auth/register", {
        tgId: this.getUserId(),
        firstName: this.getUserFirstName(),
        lastName: this.getUserLastName(),
        username: this.getUsername(),
        initData: this.getInitData(),
        parentReferralCode: this.getStartParam()?.replace("r_", "") || "",
        channelCode: "",
        inviteType: null,
      })
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.accessToken,
      Device: "android",
    };
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .get("https://apimain.iminer.fun/iapi/server/user/info", {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Tasks */
  getTasks(signal = this.signal) {
    return this.api
      .get("https://apimain.iminer.fun/iapi/server/task/task/list", {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Start Mining */
  startMining(signal = this.signal) {
    return this.api
      .post("https://apimain.iminer.fun/iapi/server/user/start/miner", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Complete Task */
  confirmTask(taskId, signal = this.signal) {
    return this.api
      .post(
        "https://apimain.iminer.fun/iapi/server/task/task/confirm",
        { taskId },
        {
          signal,
        }
      )
      .then((res) => res.data.data);
  }

  /** Claim Task Reward */
  claimTaskReward(taskId, signal = this.signal) {
    return this.api
      .post(
        "https://apimain.iminer.fun/iapi/server/task/task/reward",
        { taskId },
        {
          signal,
        }
      )
      .then((res) => res.data.data);
  }

  /** Get Event Experience */
  getEventExperience(signal = this.signal) {
    return this.api
      .get(
        "https://apimain.iminer.fun/iapi/server/event/invest/experience/running",
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Get Event Experience Details */
  getEventExperienceDetails(id, signal = this.signal) {
    return this.api
      .get(
        `https://apimain.iminer.fun/iapi/server/event/invest/experience/detail?id=${id}`,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Claim Event Experience */
  claimEventExperience(id, signal = this.signal) {
    return this.api
      .post(
        `https://apimain.iminer.fun/iapi/server/event/invest/experience/claim`,
        { id },
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Get Levels */
  getLevels(signal = this.signal) {
    return this.api
      .get(
        "https://apimain.iminer.fun/iapi/server/speed/page?page=1&limit=50&type=2",
        { signal }
      )
      .then((res) => res.data.data.list);
  }

  /** Get Wallets */
  getWallets(signal = this.signal) {
    return this.api
      .get("https://apimain.iminer.fun/iapi/server/wallet/list", { signal })
      .then((res) => res.data.data);
  }

  /** Swap Currency */
  swapCurrency(fromCurrencyId, toCurrencyId, amount, signal = this.signal) {
    return this.api
      .post(
        "https://apimain.iminer.fun/iapi/server/wallet/swap",
        { fromCurrencyId, toCurrencyId, amount },
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Upgrade Level */
  createOrder(configId, signal = this.signal) {
    return this.api
      .get(
        `https://apimain.iminer.fun/iapi/server/speed/create/order?configId=${configId}`,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUser();

    this.logUserInfo(user);

    await this.executeTask("Mining", () => this.completeMining(user));
    await this.executeTask("Tasks", () => this.completeTasks(user));
    await this.executeTask("SWAP USDT", () => this.swapUSDT(user));
    await this.executeTask("Levels", () => this.upgradeLevels(user));
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
  }

  async completeMining(user) {
    if (user.claimStatus === 1) {
      await this.startMining();
      this.logger.success(`✅ Mining started successfully!`);
    }
  }

  async completeTasks(user) {
    const tasks = await this.getTasks();
    for (const task of tasks) {
      /** Join Telegram Link */
      await this.tryToJoinTelegramLink(task.linkUrl);

      if (task.doneTask === -1) {
        await this.confirmTask(task.id);
        this.logger.success(`✅ ${task.taskName.toUpperCase()} - confirmed`);
      } else if (task.doneTask === 1 && task.claimStatus !== 1) {
        await this.claimTaskReward(task.id);
        this.logger.success(
          `🎊 ${task.taskName.toUpperCase()} - reward claimed`
        );
      }
    }
  }

  /** Swap USDT to IMR */
  async swapUSDT() {
    const wallets = await this.getWallets();
    const imrWallet = wallets.find((w) => w.currencyVO.currency === "IMR");
    const usdtWallet = wallets.find((w) => w.currencyVO.currency === "USDT");

    if (usdtWallet.balance > 0) {
      await this.swapCurrency(
        usdtWallet.currencyId,
        imrWallet.currencyId,
        Number(usdtWallet.balance)
      );
      this.logger.success(
        `💱 Swapped ${usdtWallet.balance} USDT to IMR successfully!`
      );
    }
  }

  async upgradeLevels() {
    const user = await this.getUser();
    const wallets = await this.getWallets();
    const imrWallet = wallets.find((w) => w.currencyVO.currency === "IMR");
    const levels = await this.getLevels();

    let balance = Number(imrWallet.balance);
    let currentLevel = user.miningLevel;

    while (true) {
      const nextLevel = levels.find(
        (level) => level.level === currentLevel + 1
      );
      if (!nextLevel) break; // No more levels to upgrade

      if (balance >= nextLevel.cost) {
        await this.createOrder(nextLevel.id);
        balance -= nextLevel.cost;
        currentLevel = nextLevel.level;
        this.logger.success(
          `🚀 Upgraded to level ${nextLevel.level} successfully!`
        );
        await this.utils.delayForSeconds(2);
      } else {
        break; // Not enough balance to upgrade further
      }
    }
  }
}
