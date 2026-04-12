import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { beginCell, storeStateInit } from "@ton/core";
import {
  keyPairFromSecretKey,
  mnemonicToWalletKey,
  sha256,
  sign,
} from "@ton/crypto";

import BaseFarmer from "../lib/BaseFarmer.js";

export default class ATFFarmer extends BaseFarmer {
  static id = "atf";
  static title = "ATF";
  static emoji = "🪙";
  static host = "atfminers.asloni.online";
  static domains = ["atfminers.asloni.online"];
  static telegramLink = "https://t.me/ATF_AIRDROP_bot?start=7511206091";
  static path = "/miner/index.html";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static rating = 4;
  static cookies = true;
  static interval = "*/5 * * * *";
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

  syncWallet({ publicKey, wallet, walletStateInit, network, proof }) {
    return this.makeAction("sync_wallet", {
      public_key: publicKey,
      wallet: wallet,
      wallet_state_init: walletStateInit || "",
      network: network || "",
      proof: proof || null,
    });
  }

  getWalletProofPayload() {
    return this.makeAction("get_wallet_proof_payload");
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
            emoji: "🟢",
            title: "Connect Wallet",
            action: this.connectWalletSecretKeyOrMnemonic.bind(this),
            dispatch: false,
          },
          {
            id: "reconnect-wallet",
            emoji: "🔁",
            title: "Reconnect Wallet",
            action: this.reconnectWallet.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  prepareWallet(publicKeyBuffer) {
    const walletV4 = WalletContractV4.create({
      workchain: 0,
      publicKey: publicKeyBuffer,
    });

    const walletV5 = WalletContractV5R1.create({
      workchain: 0,
      publicKey: publicKeyBuffer,
    });

    const addressV4 = walletV4.address.toString({
      bounceable: false,
    });
    const addressV5 = walletV5.address.toString({
      bounceable: false,
    });
    const rawAddressV4 = walletV4.address.toRawString();
    const rawAddressV5 = walletV5.address.toRawString();
    const publicKey = publicKeyBuffer.toString("hex");

    return {
      publicKey,
      walletV4,
      walletV5,
      addressV4,
      addressV5,
      rawAddressV4,
      rawAddressV5,
    };
  }

  logWallet(version, publicKey, address, rawAddress) {
    /** Convert version to uppercase */
    const uppercaseVersion = version.toUpperCase();

    /** Wallet version */
    this.logger.keyValue("Wallet Version", uppercaseVersion);
    /** Public key */
    this.logger.keyValue("Public Key", publicKey, {
      valueStyle: this.logger.c.yellowBright,
    });
    this.logger.newline();

    /** Wallet Address */
    this.logger.keyValue(`Wallet Address (${uppercaseVersion})`, address, {
      valueStyle: this.logger.c.whiteBright,
    });
    this.logger.newline();

    /** Raw Wallet Address */
    this.logger.keyValue(
      `Raw Wallet Address (${uppercaseVersion})`,
      rawAddress,
      {
        valueStyle: this.logger.c.greenBright,
      },
    );
    this.logger.newline();
  }

  async getKeyPair(secretKeyOrMnemonic) {
    let keyPair;
    const isHex = /^[0-9a-fA-F]+$/.test(secretKeyOrMnemonic);
    if (isHex) {
      const secretKey = Buffer.from(secretKeyOrMnemonic, "hex");

      if (secretKey.length !== 64) {
        throw new Error(
          "Invalid secret key length. Expected 64 bytes (128 hex chars).",
        );
      }

      keyPair = keyPairFromSecretKey(secretKey);
    } else {
      const mnemonic = secretKeyOrMnemonic.split(/\s+/);

      if (mnemonic.length !== 12 && mnemonic.length !== 24) {
        throw new Error("Invalid mnemonic. Must be 12 or 24 words.");
      }

      keyPair = await mnemonicToWalletKey(mnemonic);
    }

    return keyPair;
  }

  async connectWalletSecretKeyOrMnemonic() {
    const input = await this.promptInput(
      "Enter your TON Wallet Phrase / Secret Key (hex):",
    );

    const secretKeyOrMnemonic = input.trim();
    const keyPair = await this.getKeyPair(secretKeyOrMnemonic);
    const version = await this.promptInput({
      type: "select",
      text: "Select wallet version:",
      options: [
        { value: "v5", label: "Wallet V5R1" },
        { value: "v4", label: "Wallet V4" },
      ],
    });

    const connected = await this.connectAndSyncWallet(keyPair, version);

    if (connected) {
      const password = await this.promptInput(
        "Enter a password to encrypt and store your wallet:",
      );

      if (password) {
        const encryptedPhrase = await this.utils.encryption.encryptData({
          data: secretKeyOrMnemonic,
          password,
        });

        await this.storage.set("wallet", {
          encryptedPhrase,
          version,
        });

        this.logger.success("Wallet encrypted and stored successfully!");
      }
    }
  }

  async reconnectWallet() {
    const saved = await this.storage.get("wallet");
    if (!saved) {
      this.logger.warn("No wallet was previously saved!");
      return this.connectWalletSecretKeyOrMnemonic();
    } else {
      const password = await this.promptInput(
        "Enter your password to decrypt the wallet:",
      );

      const { version, encryptedPhrase } = saved;
      const secretKeyOrMnemonic = await this.utils.encryption.decryptData({
        ...encryptedPhrase,
        password,
        asText: true,
      });

      const keyPair = await this.getKeyPair(secretKeyOrMnemonic);
      await this.connectAndSyncWallet(keyPair, version);
    }
  }

  async connectAndSyncWallet(keyPair, version) {
    const {
      walletV4,
      walletV5,
      publicKey,
      addressV4,
      addressV5,
      rawAddressV4,
      rawAddressV5,
    } = this.prepareWallet(keyPair.publicKey);

    const wallet = version === "v5" ? walletV5 : walletV4;
    const address = version === "v5" ? addressV5 : addressV4;
    const rawAddress = version === "v5" ? rawAddressV5 : rawAddressV4;

    this.logWallet(version, publicKey, address, rawAddress);

    const walletStateInit = beginCell()
      .store(storeStateInit(wallet.init))
      .endCell()
      .toBoc()
      .toString("base64");

    const { proof } = await this.buildWalletProof(wallet, keyPair.secretKey);

    const result = await this.syncWallet({
      publicKey,
      wallet: rawAddress,
      walletStateInit,
      network: "-239",
      proof,
    });

    if (result.status !== "success") {
      this.logger.error(
        result.message ||
          "Failed to sync wallet with proof. Please check your secret key and try again.",
      );
      return false;
    } else {
      const user = result.user;
      this.logger.success("Wallet synced successfully!");
      this.logUserBalance(user);
      this.logUserRisks(user);
      return true;
    }
  }

  async buildWalletProof(wallet, secretKey) {
    const proofPayloadData = await this.getWalletProofPayload();
    const payload = proofPayloadData.payload;

    const timestamp = Math.floor(Date.now() / 1000);
    const domain = "atftoken.com";
    const domainBuffer = Buffer.from(domain, "utf8");
    const domainLenBuffer = Buffer.alloc(4);
    domainLenBuffer.writeUInt32LE(domainBuffer.length);

    const workchainBuffer = Buffer.alloc(4);
    workchainBuffer.writeInt32BE(wallet.address.workChain);

    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeUInt32LE(timestamp & 0xffffffff, 0);
    timestampBuffer.writeUInt32LE(Math.floor(timestamp / 0x100000000), 4);

    const message = Buffer.concat([
      Buffer.from("ton-proof-item-v2/", "utf8"),
      workchainBuffer,
      wallet.address.hash,
      domainLenBuffer,
      domainBuffer,
      timestampBuffer,
      Buffer.from(payload, "utf8"),
    ]);

    const messageHash = await sha256(message);
    const fullMessage = Buffer.concat([
      Buffer.from([0xff, 0xff]),
      Buffer.from("ton-connect", "utf8"),
      messageHash,
    ]);
    const fullMessageHash = await sha256(fullMessage);
    const signature = sign(fullMessageHash, secretKey);

    return {
      payload,
      proof: {
        timestamp,
        domain: {
          lengthBytes: domainBuffer.length,
          value: domain,
        },
        payload,
        signature: signature.toString("base64"),
      },
    };
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
    this.logger.newline();
    this.logCurrentUser();

    this.logUserBalance(user);
    this.logUserRisks(user);

    if (user["wallet_public_key"]) {
      this.logUserWallet(user);
    }
  }

  logUserBalance(user) {
    const lastMiningStart = Number(user["last_mining_start"]);
    this.logger.keyValue("Wallet Balance", user["wallet_holding_atf"]);
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

  logUserRisks(user) {
    const flags = (user["risk_flags"] || "").split("|");

    this.logger.newline();
    this.logger.keyValue("Risk Score", user["risk_score"]);
    this.logger.keyValue("Risk Updated", user["risk_updated_at"]);
    this.logger.keyValue("Risk Flags", flags.length);
    flags.forEach((flag) => this.logger.info(`- ${flag}`));

    this.logger.newline();
    this.logger.keyValue("Is banned", user["is_banned"]);
    this.logger.keyValue("Banned reason", user["banned_reason"]);
    this.logger.keyValue("Banned at", user["banned_at"]);
    this.logger.keyValue("Temp banned until", user["temp_banned_until"]);
    this.logger.keyValue("Temp ban reason", user["temp_ban_reason"]);
  }

  logUserWallet(user) {
    const { publicKey, addressV4, addressV5, rawAddressV4, rawAddressV5 } =
      this.prepareWallet(Buffer.from(user["wallet_public_key"], "hex"));

    const version = user["wallet_address"] === rawAddressV5 ? "v5" : "v4";
    const address = version === "v5" ? addressV5 : addressV4;
    const rawAddress = version === "v5" ? rawAddressV5 : rawAddressV4;

    this.logger.newline();
    this.logWallet(version, publicKey, address, rawAddress);
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
