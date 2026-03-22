import BaseFarmer from "../lib/BaseFarmer.js";
import { WalletContractV4 } from "@ton/ton";

export default class ATFFarmer extends BaseFarmer {
  static id = "atf";
  static title = "ATF";
  static emoji = "🪙";
  static host = "atfminers.asloni.online";
  static domains = ["atfminers.asloni.online"];
  static telegramLink = "https://t.me/ATF_AIRDROP_bot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static rating = 4;
  static cookies = true;
  static interval = "*/5 * * * *";
  static startupDelay = 0;
  static netRequest = {
    requestHeaders: [
      {
        header: "x-requested-with",
        operation: "set",
        value: "XMLHttpRequest",
      },
    ],
  };

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/ATF_AIRDROP_bot?start=${this.getUserId()}`;
  }

  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      const url = new URL(config.url, config.baseURL);
      url.searchParams.set("t", Date.now().toString());
      config.url = url.toString();
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      config.headers["X-Telegram-Init-Data"] = this.getInitData();
      config.headers["X-ATF-TMA-Session"] = this.auth_data
        ? this.auth_data["tma_session_token"]
        : "";

      config.data = {
        ...config.data,
        initData: this.getInitData(),
        request_id: this.utils.uuid(),
        tg_id: this.getUserId(),
      };
      return config;
    });
    return () => this.api.interceptors.request.eject(interceptor);
  }

  /** Get Auth */
  async fetchAuth() {
    this.auth_data = await this.makeAction("login", {
      username: this.getUsername(),
    });

    return this.auth_data;
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      "X-ATF-TMA-Session": data["tma_session_token"],
      "X-Telegram-Init-Data": this.getInitData(),
    };
  }

  makeAction(action, data = {}) {
    return this.api
      .post(
        `https://atfminers.asloni.online/miner/index.php?action=${action}`,
        data,
      )
      .then((res) => res.data);
  }

  claimMining(amount) {
    return this.makeAction("claim", {
      claim_preview: Number(amount),
    });
  }

  activateBoost(preview) {
    return this.makeAction("activate_boost", {
      display_preview: Number(preview),
    });
  }

  claimTask(taskId) {
    return this.makeAction("claim_task", {
      task_id: taskId,
    });
  }

  startTask(taskId) {
    return this.makeAction("start_task", {
      task_id: taskId,
    });
  }

  syncWallet({ publicKey, wallet }) {
    return this.makeAction("sync_wallet", {
      public_key: publicKey,
      wallet: wallet,
    });
  }

  getMathChallenge(scope) {
    return this.makeAction("get_math_challenge", {
      scope: scope,
    });
  }

  startMining({ challengeId, answer }) {
    return this.makeAction("start_mine", {
      math_challenge_id: challengeId,
      math_answer: answer,
    });
  }

  getFriends() {
    return this.makeAction("get_friends");
  }

  getDifficulty() {
    return this.makeAction("get_difficulty");
  }

  createTools() {
    return [
      {
        name: "Wallet",
        list: [
          {
            id: "connect-wallet",
            emoji: "🔗",
            title: "Connect Wallet",
            action: this.connectWallet.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  async connectWallet() {
    const publicKey = await this.promptInput(
      "Enter your TON Wallet (Public Key):",
    );
    const workchain = 0;
    const walletV4 = WalletContractV4.create({
      workchain,
      publicKey: Buffer.from(publicKey, "hex"),
    });

    const address = walletV4.address.toString({
      bounceable: false,
    });

    const rawAddress = walletV4.address.toRawString();

    this.logger.keyValue("Public Key", publicKey);
    this.logger.keyValue("Wallet Address", address);
    this.logger.keyValue("Raw Wallet Address", rawAddress);

    await this.syncWallet({
      publicKey,
      wallet: rawAddress,
    });

    this.logger.success("Wallet synced successfully!");
  }

  getAnswerForChallenge(question) {
    const [x, operator, y] = question.split(" ");
    let answer;
    switch (operator) {
      case "+":
        answer = parseInt(x) + parseInt(y);
        break;
      case "-":
        answer = parseInt(x) - parseInt(y);
        break;
      case "*":
        answer = parseInt(x) * parseInt(y);
        break;
      case "/":
        answer = Math.floor(parseInt(x) / parseInt(y));
        break;
      default:
        throw new Error("Unknown operator in math challenge");
    }
    return answer;
  }

  getMinerRate(level) {
    return Math.floor(10 * Math.pow(1.2, level - 1));
  }

  getDifficultyDivisor(difficulty, level, exemptMinLevel, exemptMaxLevel) {
    if (
      exemptMinLevel > 0 &&
      exemptMaxLevel > 0 &&
      level >= exemptMinLevel &&
      level <= exemptMaxLevel
    ) {
      return 1;
    }
    const d = Math.max(1, Math.min(10000, difficulty));
    if (d <= 100) return 1 + (d - 1) / 100;
    return 1.99 + (d - 100) / 15;
  }

  calculateSessionBalance({
    user,
    difficulty,
    boostCycleSeconds,
    exemptMinLevel,
    exemptMaxLevel,
  }) {
    const nowSec = Date.now() / 1000;
    const lastMiningStart = Number(user["last_mining_start"]);
    if (lastMiningStart === 0) return 0;

    const level = Number(user["miner_level"]);
    const rate = this.getMinerRate(level);
    const diffSnapshot =
      Number(user["mining_difficulty_snapshot"]) || difficulty;
    const divisor = this.getDifficultyDivisor(
      diffSnapshot,
      level,
      exemptMinLevel,
      exemptMaxLevel,
    );
    const pendingReward = Number(user["pending_reward"]) || 0;

    const elapsed = Math.min(Math.max(nowSec - lastMiningStart, 0), 86400);
    const passiveReward = elapsed * (rate / divisor / 86400);

    const boostActiveUntil = Number(user["boost_active_until"]) || 0;
    const boostPower = Number(user["boost_power_snapshot"]) || 0;
    let boostReward = 0;

    if (boostActiveUntil > lastMiningStart && boostPower > 0) {
      const boostStart = Math.max(
        lastMiningStart,
        boostActiveUntil - boostCycleSeconds,
      );
      const cappedNow = lastMiningStart + elapsed;
      const boostSeconds = Math.max(
        0,
        Math.min(cappedNow, boostActiveUntil) -
          Math.max(lastMiningStart, boostStart),
      );
      const tapReward = rate / 100000 / divisor;
      boostReward = boostSeconds * boostPower * tapReward;
    }

    return parseFloat((pendingReward + passiveReward + boostReward).toFixed(4));
  }

  /** Process Farmer */
  async process() {
    this.auth_data = await this.makeAction("login", {
      username: this.getUsername(),
    });

    const { user } = this.auth_data;

    this.logUserInfo(user);
    await this.executeTask("Mining", () => this.startOrClaimMining());
    await this.executeTask("Boost", () => this.applyBoost());
    await this.executeTask("Tasks", () => this.completeTasks());
  }
  /** Log User Info */
  logUserInfo(user) {
    const lastMiningStart = Number(user["last_mining_start"]);

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user["mined_balance"]);
    this.logger.keyValue("Pending Rewards", user["pending_reward"]);
    this.logger.keyValue("Miner Level", user["miner_level"]);
    this.logger.keyValue(
      "Last Mining Start",
      lastMiningStart === 0
        ? "Not mining"
        : new Date(lastMiningStart * 1000).toLocaleString(),
    );
  }

  async fetchDifficultyData() {
    const data = await this.getDifficulty();
    return {
      difficulty: Number(data.difficulty) || 1,
      boostCycleSeconds: Number(data.boost_cycle_seconds) || 15,
      boostTapsPerSec: Number(data.boost_taps_per_sec) || 8,
      exemptMinLevel: Number(data.difficulty_exempt_min_level) || 0,
      exemptMaxLevel: Number(data.difficulty_exempt_max_level) || 0,
    };
  }

  async startOrClaimMining() {
    const { user } = this.auth_data;
    if (!user["wallet_address"]) {
      this.logger.error(
        "No wallet connected. Please connect your wallet first.",
      );
      return;
    }

    const lastMiningStart = Number(user["last_mining_start"]);

    if (lastMiningStart === 0) {
      /** Start Mining */
      const challenge = await this.getMathChallenge("start_mine");
      const answer = this.getAnswerForChallenge(challenge.question);
      const result = await this.startMining({
        challengeId: challenge.challenge_id,
        answer: answer.toString(),
      });

      if (result.start_time) {
        this.auth_data.user["last_mining_start"] = result.start_time;
        this.auth_data.user["boost_active_until"] =
          result.boost_active_until || 0;
        this.auth_data.user["boost_power_snapshot"] =
          result.boost_power_snapshot || 0;
        this.auth_data.user["mining_difficulty_snapshot"] =
          result.mining_difficulty_snapshot || 0;
        this.logger.success("Mining started!");
      }
    } else {
      /** Claim Mining */
      const diffData = await this.fetchDifficultyData();
      const balance = this.calculateSessionBalance({
        user,
        difficulty: diffData.difficulty,
        boostCycleSeconds: diffData.boostCycleSeconds,
        exemptMinLevel: diffData.exemptMinLevel,
        exemptMaxLevel: diffData.exemptMaxLevel,
      });

      if (balance <= 0) {
        this.logger.info("No rewards to claim yet.");
        return;
      }

      this.logger.info(`Claiming ${balance} ATF...`);
      const result = await this.claimMining(balance);

      if (result.new_pool_balance !== undefined) {
        this.logger.success(
          `Claimed! Pool balance: ${result.new_pool_balance}`,
        );
      }

      /** Mining auto-restarts after claim */
      if (result.server_now) {
        this.auth_data.user["last_mining_start"] = result.server_now;
        this.auth_data.user["pending_reward"] = 0;
        this.auth_data.user["boost_active_until"] =
          result.boost_active_until || 0;
        this.auth_data.user["boost_power_snapshot"] =
          result.boost_power_snapshot || 0;
        this.auth_data.user["mining_difficulty_snapshot"] =
          result.mining_difficulty_snapshot || 0;
      }
    }
  }

  async applyBoost() {
    const { user } = this.auth_data;
    const lastMiningStart = Number(user["last_mining_start"]);

    if (lastMiningStart === 0) {
      this.logger.info("Not mining. Skipping boost.");
      return;
    }

    const nowSec = Date.now() / 1000;
    const boostActiveUntil = Number(user["boost_active_until"]) || 0;

    if (boostActiveUntil > nowSec) {
      this.logger.info("Boost already active.");
      return;
    }

    const diffData = await this.fetchDifficultyData();
    const balance = this.calculateSessionBalance({
      user,
      difficulty: diffData.difficulty,
      boostCycleSeconds: diffData.boostCycleSeconds,
      exemptMinLevel: diffData.exemptMinLevel,
      exemptMaxLevel: diffData.exemptMaxLevel,
    });

    const result = await this.activateBoost(balance);

    if (result.boost_active_until) {
      this.auth_data.user["boost_active_until"] = result.boost_active_until;
      this.auth_data.user["boost_power_snapshot"] = diffData.boostTapsPerSec;
      this.logger.success("Boost activated!");
    }
  }

  async completeTasks() {
    const { user, task_cooldowns: extraTasks } = this.auth_data;

    const tasks = [
      "telegram_join",
      "telegram_join_fa",
      "twitter_follow",
      "instagram_follow",
      "youtube_subscribe",
    ];

    const completedTasks = user.completed_tasks || [];

    const availableTasks = tasks.filter(
      (task) => !completedTasks.includes(task),
    );

    /** Complete Available Tasks */
    for (const task of availableTasks) {
      await this.claimTask(task);
      this.logger.success(`Claimed task: ${task}`);
      await this.utils.delayForSeconds(5);
    }

    /** Check Extra Tasks Cooldowns */
    for (const task in extraTasks) {
      const cooldown = extraTasks[task];
      const isAvailable = this.utils.dateFns.isAfter(
        new Date(),
        new Date(cooldown * 1000),
      );
      if (isAvailable) {
        await this.startTask(task);
        await this.utils.delayForSeconds(30);
        await this.claimTask(task);
        this.logger.success(`Completed task: ${task}`);
      }
    }
  }
}
