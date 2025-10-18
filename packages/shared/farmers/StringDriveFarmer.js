import BaseFarmer from "../lib/BaseFarmer.js";

export default class StringDriveFarmer extends BaseFarmer {
  static id = "string-drive";
  static title = "String Drive";
  static emoji = "🚘";
  static host = "st-fr-drive.stringdrive.io";
  static domains = ["st-fr-drive.stringdrive.io", "st-ba-drive.stringdrive.io"];
  static telegramLink =
    "https://t.me/stringdrive_bot/startapp?startapp=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  static SECRET_KEY =
    "_0x4927aa_0x7f7136_0x3aa021[_0x2f2673,_0x4673a1]),[_0x8f3715,_0x54e21b]";

  static GAME_ID = "682c52efdc400a61db731520";

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
    const timestamp = new Date().getTime();

    /** Create Signature */
    const data = `${this.constructor.SECRET_KEY}&TimeStamp=${timestamp}`;
    const signature = this.utils.CryptoJS.AES.encrypt(
      data,
      this.constructor.SECRET_KEY
    ).toString();

    return {
      ["WebApp"]: this.getInitData(),
      ["c0x1fd4f1"]: signature,
    };
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/stringdrive_bot/startapp?startapp=${this.getUserId()}`;
  }

  /** Get Auth */
  async fetchAuth(signal = this.signal) {
    this._authData = await this.api
      .post(
        "https://st-ba-drive.stringdrive.io/api/auth/userlogin",
        { referalId: this.getStartParam() || null },
        { signal }
      )
      .then((res) => res.data);

    const { user } = this._authData;
    this._userId = user.id;

    return this._authData;
  }

  /** Get Auth Headers */
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this._authData.token}`,
    };
  }

  /** Get String Drive User ID */
  getStringDriveUserId() {
    return this._userId;
  }

  getUserInfo(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/fetchprofile/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data.user);
  }

  /** Get User Ticket Conversion */
  getUserTicketConversion(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/fetchUserTicketConvertion/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Get User Tasks */
  getUserTasks(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/getUserTasks/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data.allTasks);
  }

  /** Get Completed User Tasks */
  getCompletedUserTasks(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/getCompletedTasks/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data.completedTasks || []);
  }

  /** Get User Completed Ads */
  getUserCompletedAds(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/getUserCompletedAds/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get User Ads */
  getUserAds(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/getUserads/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Get User Completed Ads */
  getUserCompletedAds(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/getUserCompletedAds/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data.completedAds);
  }

  /** Get Daily Reward */
  getDailyReward(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/GetDailyReward/${this.getStringDriveUserId()}`,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Claim Daily Reward */
  claimDailyReward(signal = this.signal) {
    return this.api
      .post(
        `https://st-ba-drive.stringdrive.io/api/auth/claimdailyReward/${this.getStringDriveUserId()}`,
        {},
        { signal }
      )
      .then((res) => res.data);
  }

  /** Bet Game */
  betGame(betAmount = "100", signal = this.signal) {
    return this.api
      .post(
        `https://st-ba-drive.stringdrive.io/api/auth/game/${this.getStringDriveUserId()}`,
        {
          gameId: this.constructor.GAME_ID,
          betAmount,
        },
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Submit Game Result */
  submitGameResult(
    gameHistoryId,
    playedStatus,
    winAmount,
    signal = this.signal
  ) {
    return this.api
      .post(
        `https://st-ba-drive.stringdrive.io/api/auth/game/${this.getStringDriveUserId()}`,
        {
          gameHistoryId,
          playedStatus,
          winAmount,
        },
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Get User Single Game Info */
  getUserSingleGameInfo(signal = this.signal) {
    return this.api
      .get(
        `https://st-ba-drive.stringdrive.io/api/auth/getusersinglegame/${this.constructor.GAME_ID}`,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Complete User Ad */
  completeUserAd(AdId) {
    return this.api
      .post(
        `https://st-ba-drive.stringdrive.io/api/auth/completeUserAD/${this.getStringDriveUserId()}`,
        { AdId }
      )
      .then((res) => res.data);
  }

  completeUserTask(taskId) {
    return this.api
      .post(
        `https://st-ba-drive.stringdrive.io/api/auth/completetask/${this.getStringDriveUserId()}`,
        { taskId }
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUserInfo();

    await this.getUserTicketConversion();

    this.logUserInfo(user);
    await this.executeTask("Daily Reward", () => this.completeDailyReward());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Ads", () => this.completeStringDriveAds());
    await this.executeTask("Game", () => this.playGame());
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Tickets", user.ticketBalance);
  }

  /** Complete Daily Reward */
  async completeDailyReward() {
    const dailyReward = await this.getDailyReward();

    if (dailyReward.status === "active") {
      try {
        await this.claimDailyReward();
        this.logger.success(`Daily Reward Claimed!`);
      } catch {
        // Probably already claimed
      }
    }
  }

  async completeTasks(signal = this.signal) {
    /** Tasks */
    const completedTasks = await this.getCompletedUserTasks();
    const userTasks = await this.getUserTasks();

    const availableTasks = userTasks.filter(
      (task) =>
        !completedTasks.some(
          (completedTask) => completedTask["taskId"] === task["_id"]
        )
    );

    for (const task of availableTasks) {
      await this.tryToJoinTelegramLink(task["Sitelink"]);
      await this.completeUserTask(task["_id"]);
      this.logger.success(`Task Completed: ${task["TaskName"]}`);
      await this.utils.delayForSeconds(20, { signal });
    }
  }

  /** Complete String Drive Ads */
  async completeStringDriveAds(signal = this.signal) {
    /** Ads */
    const userAds = await this.getUserAds();
    const availableAds = userAds;

    for (const ad of availableAds) {
      try {
        await this.completeUserAd(ad["_id"]);
        this.logger.success(`Ad Completed: ${ad["AdName"]}`);
        await this.utils.delayForSeconds(30, { signal });
      } catch (error) {
        this.logger.error(`Failed ad: ${ad["AdName"]}`);
      }
    }
  }

  /** Play Game */
  async playGame(signal = this.signal) {
    const gameId = this.constructor.GAME_ID;
    const game = await this.getUserSingleGameInfo();

    const max = Number(game.max);
    const user = await this.getUserInfo();
    const balance = Number(user.ticketBalance);

    if (balance >= max) {
      const TOTAL_GAMES = 5;
      const LOSE_INDEX = Math.floor(Math.random() * TOTAL_GAMES);

      for (let i = 0; i < TOTAL_GAMES; i++) {
        const isWin = i !== LOSE_INDEX;

        /* Place Bet */
        const bet = await this.betGame(String(max));
        const gameHistoryId = bet.gameHistoryId;
        this.logger.info(`Bet [${gameHistoryId}] - ${isWin ? "WIN" : "LOSE"}`);

        /* Wait for game duration */
        await this.utils.delayForSeconds(isWin ? 120 : 60, { signal });

        /* Submit Game Result */
        await this.submitGameResult(
          gameHistoryId,
          isWin ? "WON" : "LOSE",
          this.utils.extraGamePoints(isWin ? max * 6 : Math.floor(max * 2), 40)
        );

        /* Log Result */
        this.logger.success(
          `Game ${isWin ? "Won" : "Lost"} [${gameHistoryId}]`
        );
      }
    }
  }
}
