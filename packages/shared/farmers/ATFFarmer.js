import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { beginCell, storeStateInit } from "@ton/core";
import {
  keyPairFromSecretKey,
  mnemonicToWalletKey,
  sha256,
  sign,
} from "@ton/crypto";

import BaseFarmer from "../lib/BaseFarmer.js";
import Decimal from "decimal.js";

const MINIMUM_WITHDRAWABLE_AMOUNT = 500;

export default class ATFFarmer extends BaseFarmer {
  static id = "atf";
  static title = "ATF";
  static emoji = "🪙";
  static host = "atfminers.asloni.online";
  static domains = ["atfminers.asloni.online"];
  static telegramLink = "https://t.me/ATF_AIRDROP_bot?start=8577109758";
  static path = "/miner/index.html";
  static referrerMode = "random";
  static apiDelay = 500;
  static singleton = true;
  static rating = 5;
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

  /** Get or create device ID */
  getOrCreateDeviceId() {
    if (!this.deviceId) {
      this.deviceId = `dev-${this.utils.uuid()}`;
    }

    return this.deviceId;
  }

  /** Make request ID */
  makeRequestId() {
    return this.utils.uuid();
  }

  /** Determine if the request should be retried */
  shouldRetryRequest(error) {
    const retryAfter = error.response?.data?.retry_after;
    if (retryAfter) {
      return true;
    }
    return false;
  }

  /** Configure API */
  configureApi() {
    const headersInterceptor = this.api.interceptors.request.use((config) => {
      const url = new URL(config.url, config.baseURL);
      url.searchParams.set("t", Date.now().toString());
      config.url = url.toString();
      config.headers["x-requested-with"] = "XMLHttpRequest";
      config.headers["x-telegram-init-data"] = this.getInitData();

      config.data = {
        ...config.data,
        initData: this.getInitData(),
        device_id: this.getOrCreateDeviceId(),
        request_id: this.makeRequestId(),
        tg_id: this.getUserId(),
      };
      return config;
    });

    return () => {
      this.api.interceptors.request.eject(headersInterceptor);
    };
  }

  /** Get Auth */
  async fetchAuth() {
    return this.login();
  }

  /** Solve Captcha */
  async solveCaptcha() {
    /* Check if captcha has already been solved */
    if (this.has_solved_captcha) {
      return;
    }

    /* Max attempts */
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    this.logger.info("Solving captcha...");
    while (true) {
      if (this.signal.aborted) {
        throw new Error("Captcha solving aborted");
      }

      const captchaStatus = await this.getCaptchaStatus();
      const isDegradedOrCircuitOpen =
        captchaStatus.degraded || captchaStatus.reason === "db_circuit_open";

      if (isDegradedOrCircuitOpen) {
        await this.utils.delayForSeconds(5, { signal: this.signal });
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
          throw new Error("Failed to get captcha status");
        }
        continue;
      }

      if (captchaStatus.captcha_required) {
        if (!this.canSolveReCaptcha()) {
          throw new Error(
            "Captcha is required but no captcha provider is configured!",
          );
        }

        try {
          /* Solve ReCaptcha */
          const captchaToken = await this.solveReCaptcha({
            siteKey: captchaStatus.site_key,
            pageUrl: "https://atfminers.asloni.online/miner/index.html",
          });

          /* Verify Captcha */
          const captchaResponse = await this.verifyEntryCaptcha(captchaToken);

          if (captchaResponse.status !== "success") {
            throw new Error(
              "Failed to verify captcha:",
              captchaResponse.message,
            );
          }
        } catch (error) {
          this.logger.error("Failed to solve captcha:", error);
          throw error;
        }
      } else {
        break;
      }
    }

    /* Update captcha solved status */
    this.has_solved_captcha = true;
  }

  async completeLogin() {
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    this.logger.info("Completing login...");
    while (true) {
      if (this.signal.aborted) {
        throw new Error("Login aborted");
      }

      try {
        this.user_data = await this.makeLoginAction();
        break;
      } catch (error) {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
          throw new Error("Failed to sign in:", error);
        }
        const errorMessage = error.response?.data?.message || "Unknown error";
        const retryAfter = error.response?.data?.retry_after || 5;

        this.logger.error("Failed to sign in:", errorMessage);

        await this.utils.delayForSeconds(retryAfter, { signal: this.signal });
      }
    }

    return this.user_data;
  }

  /** Login */
  async login() {
    /* Solve captcha and complete login */
    await this.solveCaptcha();
    await this.completeLogin();

    return this.user_data;
  }

  makeLoginAction() {
    return this.makeAction("login", {
      force_fresh: true,
      no_cache: true,
      username: this.getUsername(),
    });
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      "x-requested-with": "XMLHttpRequest",
      "x-atf-tma-session": data["tma_session_token"],
      "x-telegram-init-data": this.getInitData(),
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

  /** Get Captcha Status */
  getCaptchaStatus() {
    return this.makeAction("captcha_status", {
      username: this.getUsername() || "",
    });
  }

  /** Verify Entry Captcha */
  verifyEntryCaptcha(captchaToken) {
    return this.makeAction("verify_entry_captcha", {
      captcha_token: captchaToken,
      username: this.getUsername() || "",
    });
  }

  /** Claim Mining */
  claimMining(amount) {
    return this.makeAction("claim", {
      claim_preview: Number(amount),
    });
  }

  /** Activate Boost */
  activateBoost(preview) {
    return this.makeAction("activate_boost", {
      display_preview: Number(preview),
    });
  }

  /** Claim Task */
  claimTask(taskId) {
    return this.makeAction("claim_task", {
      task_id: taskId,
    });
  }

  /** Start Task */
  startTask(taskId) {
    return this.makeAction("start_task", {
      task_id: taskId,
    });
  }

  /** Sync Wallet */
  syncWallet({ publicKey, wallet, walletStateInit, network, proof }) {
    return this.makeAction("sync_wallet", {
      public_key: publicKey,
      wallet: wallet,
      wallet_state_init: walletStateInit || "",
      network: network || "",
      proof: proof || null,
    });
  }

  /** Get Wallet Proof Payload */
  getWalletProofPayload() {
    return this.makeAction("get_wallet_proof_payload", { force: 1 });
  }

  /** Get Friends */
  getFriends() {
    return this.makeAction("get_friends");
  }

  /** Claim Referrals */
  claimReferrals() {
    return this.makeAction("claim_referrals");
  }

  /** Get Withdrawal Puzzle */
  getWithdrawalPuzzle() {
    return this.makeAction("get_withdraw_puzzle");
  }

  /** Request Withdrawal */
  requestWithdrawal(data) {
    return this.makeAction("withdraw", data);
  }

  /** Get Math Challenge */
  getMathChallenge(scope) {
    return this.makeAction("get_math_challenge", {
      scope: scope,
    });
  }

  /** Start Mining */
  startMining({ challengeId, answer }) {
    return this.makeAction("start_mine", {
      math_challenge_id: challengeId,
      math_answer: answer,
    });
  }

  /** Get Difficulty */
  getDifficulty() {
    return this.makeAction("get_difficulty");
  }

  /** Create Tools */
  createTools() {
    return [
      {
        name: "Wallet",
        list: [
          {
            id: "connect-wallet",
            icon: "wallet",
            title: "Connect Wallet",
            action: this.connectWalletSecretKeyOrMnemonic.bind(this),
            dispatch: false,
          },
          {
            id: "reconnect-wallet",
            icon: "connect",
            title: "Reconnect Wallet",
            action: this.reconnectWallet.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: this.withdraw.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Mining",
        list: [
          {
            id: "estimate-daily-mining",
            icon: "search",
            title: "Estimate Daily Mining",
            action: this.estimateDailyMining.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Prepare Wallet */
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

  /** Format account link */
  formatAccountLink(id) {
    return `<a href="tg://user?id=${id}">${id}</a>`;
  }

  /** Log Wallet */
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

  /** Get Key Pair */
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

  /** Connect Wallet Secret Key or Mnemonic */
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

    const { status } = await this.connectAndSyncWallet(keyPair, version);

    if (status) {
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

  /** Reconnect Wallet */
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

  /** Connect and Sync Wallet */
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

    const data = {
      publicKey,
      wallet: rawAddress,
      walletStateInit,
      network: "-239",
      proof,
    };

    this.debugger.log("Syncing ATF Wallet:", data);
    const result = await this.syncWallet(data);

    if (result.status !== "success") {
      const message =
        result.message ||
        "Failed to sync wallet with proof. Please check your secret key and try again.";
      this.logger.error(message);
      return { status: false, message };
    } else {
      const user = result.user;

      /** Update user */
      this.user_data.user = Object.assign(this.user_data.user, user);

      this.logger.success("Wallet synced successfully!");
      this.logUserBalance(user);
      this.logUserRisks(user);
      return { status: true, user };
    }
  }

  /** Build Wallet Proof */
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

  /** Place withdrawal */
  async withdraw({ max, difference = 20 } = {}) {
    const { user } = this.user_data;
    const balance = new Decimal(user["mined_balance"]);

    if (!user["wallet_public_key"]) {
      this.logger.error("No wallet public key found!");
      return {
        status: false,
        skipped: true,
        message: "No wallet public key found!",
        amount: "0",
      };
    }

    const REQUIRED_WITHDRAWABLE_AMOUNT = MINIMUM_WITHDRAWABLE_AMOUNT + 200;

    if (balance.lessThan(REQUIRED_WITHDRAWABLE_AMOUNT)) {
      this.logger.error("Not enough balance:", balance.toString());
      return {
        status: false,
        skipped: true,
        message: "Not enough balance!",
        amount: balance.toString(),
      };
    }

    /** Log balance */
    this.logger.info("Available balance:", balance.toString());

    /** Initial amount to withdraw */
    let amount = new Decimal(balance);

    /** Cap to max */
    if (max) {
      amount = Decimal.min(amount, max);
    }

    /** Apply difference */
    if (difference > 0) {
      const minPercent = new Decimal(100).minus(difference);
      const randomPercent = minPercent
        .plus(new Decimal(Math.random()).mul(difference + 1))
        .clamp(minPercent, 100);

      amount = amount.mul(randomPercent).div(100);
    }

    /** Reset amount to minimum */
    amount = Decimal.max(amount, MINIMUM_WITHDRAWABLE_AMOUNT).floor();

    /** Get challenge */
    const challenge = await this.getWithdrawalPuzzle();

    const puzzleId = challenge["challenge_id"];
    const minSolveMs = challenge["min_solve_ms"];
    const startX = challenge.slider.start_x;
    const maxX = challenge.slider.max_x;

    const targetPosition = parseFloat(
      challenge.board.svg.match(/translate\((\d+\.?\d*)\s+[\d.]+\)\s+scale/)[1],
    );

    const targetOffset = targetPosition + Math.random() * 1.5;
    const puzzleOffset = parseFloat(targetOffset.toFixed(2));

    const motionPoints = this.generateSliderMotion(
      puzzleOffset,
      startX,
      minSolveMs,
    );

    const puzzleDuration = motionPoints[motionPoints.length - 1].t;

    /** Log the puzzle data */
    this.debugger.log("Withdrawal puzzle data", {
      challenge,
      puzzleId,
      puzzleDuration,
      puzzleOffset,
      motionPoints,
    });

    /** Wait for puzzle duration */
    await this.utils.delay(puzzleDuration, { precised: true });

    /** Request withdrawal */
    const result = await this.requestWithdrawal({
      amount: amount.toString(),
      withdraw_puzzle_id: puzzleId,
      withdraw_puzzle_offset: puzzleOffset,
      withdraw_puzzle_duration_ms: puzzleDuration,
      withdraw_puzzle_motion: motionPoints,
    });

    /** Check status */
    const status = result.status === "success";
    const message = result.message;

    /** Withdrawn amount */
    let withdrawn = amount;

    if (status) {
      /** Update balance */
      this.user_data.user["mined_balance"] = result["new_balance"];

      /** Set withdrawn amount */
      withdrawn = new Decimal(result["send_amount"]).floor();

      /** Log result */
      this.logger.success(result["message"]);
      this.logger.keyValue("ID", result["withdraw_id"]);
      this.logger.keyValue("Requested amount", result["requested_amount"]);
      this.logger.keyValue("Amount to be received", result["send_amount"]);

      /**
       * Notify the admin, but only when the run was initiated by the scheduler.
       */
      if (this.scheduled) {
        await this.notifyAdmin([
          `<b>🤑 ATF Withdrawal</b>`,
          `<b>Account</b>: ${this.formatAccountLink(this.getUserId())}`,
          `<b>Current Balance</b>: ${user["mined_balance"]}`,
          `<b>Requested</b>: ${result["requested_amount"]}`,
          `<b>To receive</b>: ${result["send_amount"]}`,
          `<b>Withdraw ID</b>: <code>${result["withdraw_id"]}</code>`,
        ]);
      }
    } else {
      this.logger.error("Failed to request withdrawal:", result["message"]);
    }

    return {
      status,
      message,
      result,
      skipped: false,
      amount: withdrawn.toString(),
    };
  }

  generateSliderMotion(targetX, startX = 10, minDurationMs = 1025) {
    const totalDuration = new Decimal(minDurationMs)
      .plus(1000)
      .plus(Decimal.random().times(2000));
    const points = [];

    points.push({ x: startX, t: 0 });
    points.push({
      x: startX,
      t: new Decimal(100).plus(Decimal.random().times(100)).toNumber(),
    });

    const numPoints = 60 + Math.floor(Math.random() * 30);
    const moveStart = new Decimal(150).plus(Decimal.random().times(100));
    const moveEnd = totalDuration.times(0.85);

    for (let i = 0; i <= numPoints; i++) {
      const progress = new Decimal(i).div(numPoints);
      const eased = new Decimal(this.easeInOutWithJitter(progress.toNumber()));
      const t = moveStart.plus(moveEnd.minus(moveStart).times(progress));
      const x = new Decimal(startX).plus(
        new Decimal(targetX).minus(startX).times(eased),
      );
      points.push({
        x: x.toDecimalPlaces(2).toNumber(),
        t: t.floor().toNumber(),
      });
    }

    points.push({
      x: targetX,
      t: totalDuration.times(0.92).floor().toNumber(),
    });
    points.push({
      x: targetX,
      t: totalDuration.floor().toNumber(),
    });

    return points;
  }

  easeInOutWithJitter(t) {
    const dt = new Decimal(t);
    const eased = dt.lt(0.5)
      ? dt.times(dt).times(dt).times(4)
      : new Decimal(1).minus(new Decimal(-2).times(dt).plus(2).pow(3).div(2));
    const jitter = new Decimal(Math.random()).minus(0.5).times(0.02);
    const result = eased.plus(jitter);
    return Decimal.min(1, Decimal.max(0, result)).toNumber();
  }

  getAnswerForChallenge(question) {
    const match = question.toLowerCase().match(/(\d+)\s*([+\-*/÷x])\s*(\d+)/);
    if (!match) throw new Error("Invalid math challenge format");

    const x = Number(match[1]);
    const y = Number(match[3]);
    const op = match[2];

    if (op === "+") return x + y;
    if (op === "-") return x - y;
    if (op === "*" || op === "x") return x * y;
    if (op === "/" || op === "÷") {
      if (y === 0) throw new Error("Division by zero");
      return Math.floor(x / y);
    }

    throw new Error("Unknown operator");
  }

  getMinerRate(level) {
    return new Decimal(10).times(new Decimal(1.2).pow(level - 1)).floor();
  }

  getMinerCost(level) {
    if (level <= 1) return new Decimal(0);
    return new Decimal(100).times(new Decimal(1.3).pow(level - 2)).floor();
  }

  findLevelForAtf(atfAmount) {
    const amount = new Decimal(atfAmount);
    let level = 1;
    while (level < 100 && amount.gte(this.getMinerCost(level + 1))) {
      level++;
    }
    return level;
  }

  getDifficultyDivisor(difficulty, level, exemptMinLevel, exemptMaxLevel) {
    if (
      exemptMinLevel > 0 &&
      exemptMaxLevel > 0 &&
      level >= exemptMinLevel &&
      level <= exemptMaxLevel
    ) {
      return new Decimal(1);
    }
    const d = new Decimal(difficulty).clamp(1, 10000);
    if (d.lte(100)) return d.minus(1).div(100).plus(1);
    return d.minus(100).div(15).plus(1.99);
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
    if (lastMiningStart === 0) return new Decimal(0);

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
    const pendingReward = new Decimal(user["pending_reward"] || 0);

    const elapsed = Math.min(Math.max(nowSec - lastMiningStart, 0), 86400);
    const passiveReward = rate.div(divisor).div(86400).times(elapsed);

    const boostActiveUntil = Number(user["boost_active_until"]) || 0;
    const boostPower = Number(user["boost_power_snapshot"]) || 0;
    let boostReward = new Decimal(0);

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
      const tapReward = rate.div(100000).div(divisor);
      boostReward = tapReward.times(boostSeconds).times(boostPower);
    }

    return pendingReward
      .plus(passiveReward)
      .plus(boostReward)
      .toDecimalPlaces(4);
  }

  /** Process Farmer */
  async process() {
    const { user } = await this.login();

    await this.logUserInfo(user);
    await this.executeTask("Mining", () => this.startOrClaimMining());
    await this.executeTask("Boost", () => this.applyBoost());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Extra Tasks", () => this.completeExtraTasks());
    await this.executeTask("Friends", () => this.claimFriendsRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
  }

  /** Get User Details */
  getUserDetails() {
    return this.user_data.user;
  }

  /** Log User Info */
  async logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();

    const diffData = await this.fetchDifficultyData();
    this.logUserBalance(user, diffData);
    this.logUserRisks(user);

    if (user["wallet_public_key"]) {
      this.logUserWallet(user);
    }
  }

  getDailyMiningRateForLevel(level, diffData, diffSnapshot) {
    const rate = this.getMinerRate(level);
    const divisor = this.getDifficultyDivisor(
      diffSnapshot || diffData.difficulty,
      level,
      diffData.exemptMinLevel,
      diffData.exemptMaxLevel,
    );
    return rate.div(divisor);
  }

  getDailyMiningRate(user, diffData) {
    return this.getDailyMiningRateForLevel(
      Number(user["miner_level"]),
      diffData,
      Number(user["mining_difficulty_snapshot"]) || 0,
    );
  }

  logUserBalance(user, diffData) {
    const lastMiningStart = Number(user["last_mining_start"]);
    const miningFreezesAt = Number(user["mining_freezes_at"]);
    const isMiningFrozen = user["mining_frozen"] === 1;
    this.logger.keyValue("Wallet Balance", user["wallet_holding_atf"]);
    this.logger.keyValue("Balance", user["mined_balance"]);
    this.logger.keyValue("Pending Rewards", user["pending_reward"]);
    this.logger.keyValue("Miner Level", user["miner_level"]);

    if (diffData) {
      this.logger.keyValue(
        "Daily Mining",
        this.getDailyMiningRate(user, diffData).toDecimalPlaces(4).toString(),
        { valueStyle: this.logger.c.greenBright },
      );
    }
    this.logger.keyValue(
      "Last Mining Start",
      lastMiningStart === 0
        ? "Not mining"
        : new Date(lastMiningStart * 1000).toLocaleString(),
    );
    this.logger.keyValue(
      "Mining freezes at",
      miningFreezesAt === 0
        ? "Not mining"
        : new Date(miningFreezesAt * 1000).toLocaleString(),
    );

    if (isMiningFrozen) {
      this.logger.keyValue("Mining Frozen", "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }
  }

  logUserRisks(user) {
    const flags = (user["risk_flags"] || "").trim().split("|").filter(Boolean);

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

  getUserWallet(user) {
    const { publicKey, addressV4, addressV5, rawAddressV4, rawAddressV5 } =
      this.prepareWallet(Buffer.from(user["wallet_public_key"], "hex"));

    const version = user["wallet_address"] === rawAddressV5 ? "v5" : "v4";
    const address = version === "v5" ? addressV5 : addressV4;
    const rawAddress = version === "v5" ? rawAddressV5 : rawAddressV4;

    return { version, publicKey, address, rawAddress };
  }

  logUserWallet(user) {
    const { version, publicKey, address, rawAddress } =
      this.getUserWallet(user);

    this.logger.newline();
    this.logWallet(version, publicKey, address, rawAddress);
  }

  async estimateDailyMining() {
    const input = await this.promptInput("How much ATF?");
    const trimmed = (input || "").trim();

    if (!trimmed) return;

    let amount;
    try {
      amount = new Decimal(trimmed);
    } catch {
      this.logger.error("Invalid ATF amount:", trimmed);
      return;
    }

    if (amount.isNegative()) {
      this.logger.error("ATF amount must be non-negative");
      return;
    }

    const level = this.findLevelForAtf(amount);
    const diffData = await this.fetchDifficultyData();
    const dailyRate = this.getDailyMiningRateForLevel(level, diffData);

    this.logger.newline();
    this.logger.keyValue("ATF Amount", amount.toString());
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue("Level Cost", this.getMinerCost(level).toString());
    this.logger.keyValue(
      "Daily Mining",
      dailyRate.toDecimalPlaces(4).toString(),
      { valueStyle: this.logger.c.greenBright },
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

  /** Start of claim mining */
  async startOrClaimMining() {
    const { user } = this.user_data;
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

      /** Delay before submitting */
      await this.utils.delayForSeconds(5);

      const result = await this.startMining({
        challengeId: challenge.challenge_id,
        answer: answer.toString(),
      });

      if (result.start_time) {
        this.user_data.user["last_mining_start"] = result.start_time;
        this.user_data.user["boost_active_until"] =
          result.boost_active_until || 0;
        this.user_data.user["boost_power_snapshot"] =
          result.boost_power_snapshot || 0;
        this.user_data.user["mining_difficulty_snapshot"] =
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

      if (balance.lte(0)) {
        this.logger.warn("No rewards to claim yet.");
        return;
      }

      /** Delay before claiming */
      await this.utils.delayForSeconds(5);

      this.logger.info(`Claiming ${balance.toString()} ATF...`);
      const result = await this.claimMining(balance);

      if (result.new_pool_balance !== undefined) {
        this.user_data.user["mined_balance"] = result.new_pool_balance;
        this.logger.success(
          `Claimed! Pool balance: ${result.new_pool_balance}`,
        );
      }

      /** Mining auto-restarts after claim */
      if (result.server_now) {
        this.user_data.user["last_mining_start"] = result.server_now;
        this.user_data.user["pending_reward"] = 0;
        this.user_data.user["boost_active_until"] =
          result.boost_active_until || 0;
        this.user_data.user["boost_power_snapshot"] =
          result.boost_power_snapshot || 0;
        this.user_data.user["mining_difficulty_snapshot"] =
          result.mining_difficulty_snapshot || 0;
      }
    }
  }

  async applyBoost() {
    const { user } = this.user_data;
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

    /** Delay before activating */
    await this.utils.delayForSeconds(3);

    const result = await this.activateBoost(balance);

    if (result.boost_active_until) {
      this.user_data.user["boost_active_until"] = result.boost_active_until;
      this.user_data.user["boost_power_snapshot"] = diffData.boostTapsPerSec;
      this.logger.success("Boost activated!");
    }
  }

  async completeTasks() {
    const { user } = this.user_data;

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
      if (this.signal.aborted) break;
      await this.claimTask(task);
      this.logger.success(`Claimed task: ${task}`);
      await this.utils.delayForSeconds(20);
    }
  }

  /** Complete Extra Tasks */
  async completeExtraTasks() {
    const { task_cooldowns: extraTasks } = this.user_data;

    const allAvailable = Object.values(extraTasks).every((cooldown) =>
      this.utils.dateFns.isAfter(new Date(), new Date(cooldown * 1000)),
    );

    if (!allAvailable) {
      this.logger.warn("Extra tasks not available");
      return;
    }

    /** Check Extra Tasks Cooldowns */
    for (const task in extraTasks) {
      if (this.signal.aborted) break;
      await this.startTask(task);
      await this.utils.delayForSeconds(30);
      await this.claimTask(task);
      this.logger.success(`Completed task: ${task}`);
      await this.utils.delayForSeconds(10);
    }
  }

  /** Claim Friends Rewards */
  async claimFriendsRewards() {
    const friends = await this.getFriends();
    const claimable = friends.claimable;

    if (claimable > 0) {
      const result = await this.claimReferrals();

      /** Update balance and level */
      this.user_data.user["assets_total"] = result.assets_total;
      this.user_data.user["mined_balance"] = result.new_balance;
      this.user_data.user["miner_level"] = result.new_level;

      this.logger.success(`Claimed ${claimable} ATF from referrals!`);
    } else {
      this.logger.info("No referral rewards to claim.");
    }
  }
}
