import BaseFarmer from "../lib/BaseFarmer.js";

export default class OilTycoonFarmer extends BaseFarmer {
  static id = "oil-tycoon";
  static title = "Oil Tycoon";
  static emoji = "🛢️";
  static host = "web.oiltycoonton.top";
  static domains = ["web.oiltycoonton.top", "api.oiltycoonton.top"];
  static telegramLink =
    "https://t.me/OilTycoonTON_bot/game?startapp=ii_1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static rating = 4;

  createTools() {
    return [
      {
        id: "set-wallet-address",
        title: "💵 Set Wallet Address",
        action: this.configureWalletAddress.bind(this),
      },
      {
        id: "disconnect-wallet",
        title: "❌ Disconnect Wallet",
        action: this.disconnectWallet.bind(this),
      },
    ];
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/OilTycoonTON_bot/game?startapp=ii_${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return this.api
      .post(
        "https://api.oiltycoonton.top/api/user/login",
        new URLSearchParams({
          invited_id: this.getStartParam()?.replace("ii_", ""),
        }),
        {
          headers: {
            Authorization: this.getInitData(),
          },
        }
      )
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.token,
    };
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/user/info", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  getPubShareMsgId(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/user/getPubShareMsgId", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  getAssistanceId(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/user/getAssistanceId", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  getSystemConfig(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/systemconfig/index", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  getPayUrl(signal = this.signal) {
    return this.api
      .get("https://api.oiltycoonton.top/api/pay/getPayUrl", {
        signal,
      })
      .then((res) => res.data.data);
  }

  getGameLevel(signal = this.signal) {
    return this.api
      .get("https://api.oiltycoonton.top/api/game/level", { signal })
      .then((res) => res.data.data);
  }

  getTasksForUpgrade(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/task/up_list", null, { signal })
      .then((res) => res.data.data);
  }

  checkTask(id, signal = this.signal) {
    return this.api
      .post(
        "https://api.oiltycoonton.top/api/task/check",
        new URLSearchParams({
          id,
        }),
        { signal }
      )
      .then((res) => res.data.data);
  }

  sellOil(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/game/sell", null, { signal })
      .then((res) => res.data.data);
  }

  startGame(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/game/start", null, { signal })
      .then((res) => res.data.data);
  }

  startUser(signal = this.signal) {
    return this.api
      .post("https://api.oiltycoonton.top/api/user/start", null, { signal })
      .then((res) => res.data.data);
  }

  connectWallet(wallet = "", signal = this.signal) {
    return this.api
      .post(
        "https://api.oiltycoonton.top/api/wallet/connect",
        new URLSearchParams({
          wallet,
        }),
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUser();

    this.logUserInfo(user);
    await this.executeTask("Game", () => this.playGame(user));
    await this.executeTask("Upgrade Level", () => this.upgradeLevel());
  }

  /** Configure Wallet Address */
  async configureWalletAddress() {
    const walletAddress = await this.promptInput("Enter your wallet address:");

    if (!walletAddress) {
      this.logger.warn("⚠️ Wallet address not provided. Skipping...");
      return null;
    }
    this.logger.info(`🔄 Setting wallet address ${walletAddress}...`);
    await this.connectWallet(walletAddress);
    this.logger.success("✅ Wallet address set successfully!");
  }

  async disconnectWallet() {
    this.logger.info(`🔄 Disconnecting wallet...`);
    await this.connectWallet("");
    this.logger.success("✅ Wallet disconnected successfully!");
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Now", user["now"]);
    this.logger.keyValue("Balance", user["balance"]);
    this.logger.keyValue("Coin", user["coin"]);
    this.logger.keyValue("Max", user["max"]);
    this.logger.keyValue("Level", user["level"]);
    this.logger.keyValue("Level (EXP)", user["level_exp"]);
  }

  async playGame(user) {
    if (user["start_status"] === 0) {
      await this.startGame();
      this.logger.info("Game started.");
    }

    if (user["new_user"]) {
      await this.startUser();
      this.logger.info("New user started the game.");
    }
  }

  async upgradeLevel() {
    const tasks = await this.getTasksForUpgrade();

    const availableTasks = tasks.filter(
      (task) =>
        !task["completed"] &&
        !task["is_pay"] &&
        !["wallet", "follow the bot"].some((name) =>
          task["name"].toLowerCase().includes(name.toLowerCase())
        )
    );

    for (const task of availableTasks) {
      if (this.signal.aborted) return;
      await this.tryToJoinTelegramLink(task["jump_url"]);
      const result = await this.checkTask(task["id"]);
      if (result.completed) {
        this.logger.success(`Task "${task["name"]}" completed.`);
      } else {
        this.logger.warn(`Task "${task["name"]}" not completed yet.`);
      }
      await this.utils.delayForSeconds(task["wait_time"] || 5, {
        signal: this.signal,
      });
    }
  }
}
