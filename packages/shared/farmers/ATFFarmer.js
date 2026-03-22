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

  getAnswerFromChallenge(question) {
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

  /** Process Farmer */
  async process() {
    this.auth_data = await this.makeAction("login", {
      username: this.getUsername(),
    });

    const { user } = this.auth_data;

    this.logUserInfo(user);
    await this.executeTask("Mining", () => this.startOrClaimMining());
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
      const challenge = await this.getMathChallenge("start_mine");
      const answer = this.getAnswerFromChallenge(challenge.question);
      const result = await this.startMining({
        challengeId: challenge.challenge_id,
        answer: answer.toString(),
      });
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
      (task) => !completedTasks.includes(task) && extraTasks[task] === 0,
    );

    for (const task of availableTasks) {
      await this.claimTask(task);
      this.logger.success(`Claimed task: ${task}`);
      await this.utils.delayForSeconds(5);
    }

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
