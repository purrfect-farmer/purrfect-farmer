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
      config.headers["x-whiskers-user-agent"] = this.userAgent;
      config.headers["X-Telegram-Init-Data"] = this.getInitData();
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

  /** Get Auth */
  async fetchAuth() {
    this.authData = await this.makeAction("login", {
      username: this.getUsername(),
    });

    return this.authData;
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      "X-ATF-TMA-Session": data["tma_session_token"],
      "X-Telegram-Init-Data": this.getInitData(),
    };
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
    const { user } = this.authData;

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
    const { user } = this.authData;
    if (!user["wallet_address"]) {
      this.logger.error(
        "No wallet connected. Please connect your wallet first.",
      );
      return;
    }

    const lastMiningStart = Number(user["last_mining_start"]);

    console.log("Last mining start timestamp:", lastMiningStart);

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
    const { user, task_cooldowns: extraTasks } = this.authData;

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

/**
{
    "status": "success",
    "user": {
        "id": "53335",
        "tg_id": "8472911086",
        "username": "",
        "first_name": "Rrrrghh",
        "wallet_address": "0:68367de8d3d87b8e00393b14da919aace5b58ab65675d9dd665f7e7c5b7a7504",
        "wallet_holding_atf": "0.0000",
        "mined_balance": "0.0000",
        "pending_reward": "0.0000",
        "miner_level": 1,
        "max_miner_level": 1,
        "last_mining_start": "0",
        "created_at": "2026-03-22 12:14:05",
        "referred_by": "1147265290",
        "ref_success": "0",
        "referrals_claimed": "0",
        "is_banned": "0",
        "banned_reason": null,
        "banned_at": null,
        "wallet_verified": "1",
        "wallet_public_key": "faa572a5f22d104b69e954fffc52cf0adf09eb989a294b7b016702eda989e229",
        "proof_payload": null,
        "proof_payload_exp": "0",
        "wallet_verified_at": "2026-03-22 12:47:59",
        "human_challenge_hash": null,
        "human_challenge_exp": null,
        "human_passed": "0",
        "human_passed_at": null,
        "boost_ready_at": "1774180079",
        "boost_active_until": "0",
        "mining_difficulty_snapshot": "70",
        "boost_power_snapshot": "0",
        "max_level_reached": "1",
        "ref_success_wallet": null,
        "ref_success_at": null,
        "withdraw_puzzle_failed_attempts": "0",
        "withdraw_puzzle_locked_until": "0",
        "withdraw_puzzle_last_failed_at": "0",
        "claimable_now": 0,
        "assets_total": 0,
        "completed_tasks": []
    },
    "difficulty": 70,
    "difficulty_setting": 70,
    "difficulty_exempt_min_level": 1,
    "difficulty_exempt_max_level": 2,
    "boost_cycle_seconds": 8,
    "boost_taps_per_sec": 0.5,
    "task_cooldowns": {
        "website_visit": 0,
        "youtube_like_comment": 0,
        "instagram_like_comment": 0,
        "twitter_retweet": 0
    },
    "task_starts": [],
    "tma_session_token": "eyJ0Z19pZCI6Ijg0NzI5MTEwODYiLCJpaCI6ImE0ZjgxNjU0ZDYxOTRjYTZkNTZiNGI2ZmVhZDJiZDM5MmY3YTQ5NDYzOTk3YmUwYTc4YmZjMDVhMzU3MjY2MGQiLCJ1YSI6ImM4MDg3ZTEyYjMyZjhiOTVjZDc1YjE3MDFkMjM3N2Q2IiwiaHN0IjoiYXRmbWluZXJzLmFzbG9uaS5vbmxpbmUiLCJpYXQiOjE3NzQxODAzOTYsImV4cCI6MTc3NDIyMzU5Nn0.IKRsVOnasxQJocOIfwDZ9jwVeiKXZWdPz38ZTUMeZ6A"
}


 */
