import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";

import BaseFarmer from "../lib/BaseFarmer.js";
import Decimal from "decimal.js";
import { buildTonProof, getWalletStateInit } from "../lib/ton/proof.js";
import { keyPairFromPhraseOrSecretKey } from "../lib/ton/wallet.js";

/** Backstop for the withdrawal captcha loop */
const WITHDRAWAL_CAPTCHA_ATTEMPTS = 5;

/** The app freezes mining 72h after the last start or claim */
const MAX_MINING_CYCLE_SECONDS = 259200;

/** One-time tasks from the app's tasksConfig, without the disabled Instagram ones */
const ONE_TIME_TASKS = [
  { id: "telegram_join", link: "https://t.me/AI_TRADING_FOREX" },
  { id: "telegram_join_fa", link: "https://t.me/ATFFARSI" },
  { id: "twitter_follow" },
  { id: "youtube_subscribe" },
];

/** Repeatable tasks from the app's tasksConfig, claimable once minSeconds pass after a start */
const COOLDOWN_TASKS = [
  { id: "youtube_like_comment", minSeconds: 30 },
  { id: "twitter_retweet", minSeconds: 30 },
  { id: "website_visit", minSeconds: 10 },
  { id: "telegram_react_latest", minSeconds: 20 },
];

/** Maximum number of attempts to solve a captcha */
const MAX_CAPTCHA_ATTEMPTS = 10;

/** Maximum number of attempts to complete a login */
const MAX_LOGIN_ATTEMPTS = 10;

/** Maximum number of attempts to sync a wallet */
const MAX_SYNC_ATTEMPTS = 20;

/** Whether to solve the captcha before login */
const SHOULD_SOLVE_CAPTCHA_BEFORE_LOGIN = true;

/** Device ID mode */
const DEVICE_ID_MODE = "random";

/* Record navigation batch */
const RECORD_NAVIGATION_BATCH = true;

/** Record Daily Interaction */
const RECORD_DAILY_INTERACTION = false;

export default class ATFFarmer extends BaseFarmer {
  static published = true;
  static id = "atf";
  static title = "ATF";
  static emoji = "🪙";
  static host = "atfminers.asloni.online";
  static domains = ["atfminers.asloni.online"];
  static telegramLink = "https://t.me/ATF_AIRDROP_bot?start=8577109758";
  static path = "/miner/index.html";
  static interval = "0 */2 * * *";
  static apiDelay = 500;
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

  static auto = {
    id: "atf-auto",
    title: "ATF Auto",
    token: "ATF",
    jettonAddress: "EQANcW45W0Tp91bzvHayaPO6-6hf1Lm4XlWZ4rN6L5ofPWdb",
    storagePrefix: "atf-auto",
    minWithdrawal: 500,
    connectWithPhrase: true,
  };

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/ATF_AIRDROP_bot?start=${this.getUserId()}`;
  }

  /** Get or create device ID */
  getOrCreateDeviceId() {
    if (!this.deviceId) {
      const mode = DEVICE_ID_MODE;

      if (mode === "unique") {
        /* Seeded by the user, so the device ID stays the same across runs */
        const random = this.getUserRandomGenerator();
        const hex = (length) =>
          Array.from({ length }, () =>
            Math.floor(random() * 16).toString(16),
          ).join("");

        const variant = (8 + Math.floor(random() * 4)).toString(16);

        this.deviceId = `dev-${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(
          3,
        )}-${hex(12)}`;
      } else {
        this.deviceId = `dev-${this.utils.uuid()}`;
      }
    }

    return this.deviceId;
  }

  /** Configure API */
  configureApi() {
    const headersInterceptor = this.api.interceptors.request.use((config) => {
      const url = new URL(config.url, config.baseURL);
      url.searchParams.set("t", Date.now().toString());
      config.url = url.toString();
      Object.assign(config.headers, this.getAuthHeaders());

      config.data = {
        request_id: this.makeRequestId(),
        device_id: this.getOrCreateDeviceId(),
        ...config.data,
        initData: this.getInitData(),
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

    /* Attempts */
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
        if (attempts > MAX_CAPTCHA_ATTEMPTS) {
          throw new Error("Failed to get captcha status");
        }
        continue;
      }

      if (captchaStatus.captcha_required) {
        if (!this.canSolveTurnstile()) {
          throw new Error(
            "Captcha is required but no captcha provider is configured!",
          );
        }

        try {
          /* Solve ReCaptcha */
          const captchaToken = await this.solveTurnstile({
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

  /** The drop can answer a login with an image captcha instead of the account, as a 200 or a 4xx body */
  getEntryRiskChallenge(payload) {
    return payload?.["reason"] === "entry_risk_captcha_required" &&
      payload?.["captcha_image"]
      ? payload
      : null;
  }

  /** Answer one entry risk challenge, letting the login loop mint a new image for a refused answer
   * @returns {Promise<boolean>} whether the challenge was verified
   */
  async solveEntryRiskCaptcha(challenge) {
    if (this.signal.aborted) {
      throw new Error("Captcha solving aborted");
    }

    /** An answer submitted against an expiring challenge is wasted */
    const expiresIn = Number(challenge["expires_in"]);

    if (Number.isFinite(expiresIn) && expiresIn <= 5) {
      this.logger.warn("Entry risk captcha expired, asking for a new one...");
      return false;
    }

    const answer = await this.resolveImageCaptchaAnswer({
      image: challenge["captcha_image"],
      promptText: challenge["message"] || "Solve the captcha to sign in:",
      label: "entry risk captcha",
    });

    /** A wrong answer is refused with a 403 carrying the reason */
    let result;

    try {
      result = await this.verifyEntryRiskCaptcha({
        challengeId: challenge["challenge_id"],
        answer,
      });
    } catch (error) {
      if (!error.response?.data) {
        throw error;
      }
      result = error.response.data;
    }

    if (result?.["verified"] === true || result?.["status"] === "success") {
      this.logger.success("Entry risk captcha verified.");
      return true;
    }

    this.logger.error(
      "Entry risk captcha rejected:",
      result?.["message"] || "Unknown error",
    );

    await this.utils.delayForSeconds(2, { signal: this.signal });

    return false;
  }

  /** @param {boolean} forceFresh - make the backend re-read the account */
  async completeLogin(forceFresh = false) {
    /* Attempts */
    let attempts = 0;

    this.logger.info("Completing login...");
    while (true) {
      if (this.signal.aborted) {
        throw new Error("Login aborted");
      }

      /** Answered outside the try, so having no way to answer fails the login instead of retrying it */
      let challenge = null;

      try {
        const data = await this.makeLoginAction(forceFresh);

        challenge = this.getEntryRiskChallenge(data);

        if (!challenge) {
          this.user_data = data;

          if (data?.["tma_session_token"]) {
            this.tmaSessionToken = data["tma_session_token"];
          }
          break;
        }
      } catch (error) {
        challenge = this.getEntryRiskChallenge(error.response?.data);

        if (!challenge) {
          attempts++;
          if (attempts > MAX_LOGIN_ATTEMPTS) {
            throw new Error("Failed to sign in:", error);
          }
          const errorMessage = error.response?.data?.message || "Unknown error";
          const retryAfter = error.response?.data?.retry_after || 5;

          this.logger.error("Failed to sign in:", errorMessage);

          await this.utils.delayForSeconds(retryAfter, { signal: this.signal });
          continue;
        }
      }

      /** The drop withheld the account behind an image captcha */
      attempts++;
      if (attempts > MAX_LOGIN_ATTEMPTS) {
        throw new Error("Failed to sign in: entry risk captcha required");
      }

      this.logger.warn("Entry risk captcha required.");

      await this.solveEntryRiskCaptcha(challenge);
    }

    return this.user_data;
  }

  /** Login */
  async login(forceFresh = false) {
    /* Solve captcha and complete login */

    if (SHOULD_SOLVE_CAPTCHA_BEFORE_LOGIN) {
      await this.solveCaptcha();
    }

    await this.completeLogin(forceFresh);

    return this.user_data;
  }

  makeLoginAction(forceFresh = false) {
    /** The app sends the username and the inviter it was opened with */
    const refCode = this.getReferrerStartParam();

    return this.makeAction(
      "login",
      {
        username: this.getUsername(),
        ...(refCode ? { ref_code: refCode } : {}),
        ...(forceFresh ? { force_fresh: true, no_cache: true } : {}),
      },
      this.constructor.RISK_CHALLENGE_CONFIG,
    );
  }

  /** Record Daily Interaction */
  async recordDailyInteraction() {
    if (!RECORD_DAILY_INTERACTION) {
      return;
    }

    /** The app only reports once foreground >= 15, scroll >= 300, menus >= 2 and a menu change */
    await this.makeAction("record_daily_interaction", {
      foreground_seconds: 15 + Math.floor(Math.random() * 60),
      scroll_pixels: 300 + Math.floor(Math.random() * 900),
      unique_menus: 2 + Math.floor(Math.random() * 3),
      menu_changes: 1 + Math.floor(Math.random() * 6),
      trusted_input: 1,
    });
    await this.utils.delay(300, { signal: this.signal });
  }

  /** Record Navigation Batch */
  async recordNavigationBatch(delta = 1) {
    if (!RECORD_NAVIGATION_BATCH) {
      return;
    }

    await this.makeAction("record_navigation_batch", {
      delta: delta,
      batch_id: `nav_${this.utils.uuid()}`,
    });
    await this.utils.delay(300, { signal: this.signal });
  }

  /** Get Auth Headers, with the session token login hands out once it has */
  getAuthHeaders() {
    const headers = {
      "x-requested-with": "XMLHttpRequest",
      "x-telegram-init-data": this.getInitData(),
    };

    if (this.tmaSessionToken) {
      headers["x-atf-tma-session"] = this.tmaSessionToken;
    }

    return headers;
  }

  makeAction(action, data = {}, config = {}) {
    return this.api
      .post(
        `https://atfminers.asloni.online/miner/index.php?action=${action}`,
        data,
        config,
      )
      .then((res) => res.data);
  }

  /** The drop answers the entry risk challenge with a 403, which the extension would reset the farmer over */
  static RISK_CHALLENGE_CONFIG = { ignoreUnauthorizedError: true };

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

  /** Verify Entry Risk Captcha */
  verifyEntryRiskCaptcha({ challengeId, answer }) {
    return this.makeAction(
      "verify_entry_risk_captcha",
      {
        challenge_id: challengeId,
        captcha_answer: answer,
      },
      this.constructor.RISK_CHALLENGE_CONFIG,
    );
  }

  /** Connect to Toobit */
  connectToobitUid(uid = "") {
    return this.makeAction("toobit_connect", {
      uid,
    });
  }

  /** Get Toobit Status */
  getToobitStatus() {
    return this.makeAction("toobit_status");
  }

  /** Disconnect Toobit */
  disconnectToobitUid() {
    return this.makeAction("toobit_disconnect");
  }

  /** Check Toobit KYC, which the live app no longer calls */
  checkToobitKyc() {
    return this.makeAction("toobit_check_kyc", {
      request_id:
        "kyc_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 12),
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
  claimTask(taskId, clientStartedAt = 0) {
    return this.makeAction("claim_task", {
      task_id: taskId,
      client_started_at: clientStartedAt,
    });
  }

  /** Start Task */
  startTask(taskId, clientStartedAt = 0) {
    return this.makeAction("start_task", {
      task_id: taskId,
      client_started_at: clientStartedAt,
    });
  }

  /** Disconnect Wallet */
  disconnectWallet(wallet) {
    return this.makeAction("disconnect_wallet", {
      wallet,
      disconnect_intent: "explicit_user",
    });
  }

  /** Sync Wallet */
  syncWallet({
    publicKey,
    wallet,
    walletStateInit,
    network,
    proof,
    refreshHolding = 1,
  }) {
    return this.makeAction("sync_wallet", {
      refresh_holding: refreshHolding,
      public_key: publicKey || "",
      wallet_state_init: walletStateInit || "",
      wallet: wallet || "",
      network: network || "",
      proof: proof || null,
    });
  }

  /** Resync Wallet */
  resyncWallet() {
    return this.syncWallet({
      refreshHolding: 0,
      wallet: this.user_data?.user?.["wallet_address"],
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

  /** Get Withdraw History */
  getWithdrawHistory() {
    return this.makeAction("get_withdraw_history");
  }

  /** Claim Referrals */
  claimReferrals() {
    return this.makeAction("claim_referrals");
  }

  /** Claim Team Wallet */
  claimTeamWallet() {
    return this.makeAction("claim_team_wallet");
  }

  /** Get Withdrawal Puzzle */
  getWithdrawalPuzzle(amount) {
    return this.makeAction("get_withdraw_puzzle", { amount: Number(amount) });
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
          ...this.createAutoWalletTools(),
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
          {
            id: "pending-withdrawals",
            icon: "history",
            title: "Pending Withdrawals",
            action: this.logPendingWithdrawals.bind(this),
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
      {
        name: "Verification",
        list: [
          {
            id: "register-toobit",
            icon: "register",
            title: "Register to Toobit",
            action: this.registerToToobit.bind(this),
            dispatch: false,
          },
          {
            id: "connect-toobit-user",
            icon: "user",
            title: "Connect Toobit User",
            action: this.connectToobitUser.bind(this),
            dispatch: false,
          },
          {
            id: "toobit-status",
            icon: "check",
            title: "Toobit Status",
            action: this.logToobitStatus.bind(this),
            dispatch: false,
          },
          {
            id: "disconnect-toobit",
            icon: "disconnect",
            title: "Disconnect Toobit",
            action: this.disconnectToobitInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "check-toobit-kyc",
            icon: "kyc",
            title: "Check Toobit KYC",
            action: this.checkToobitKycInteractive.bind(this),
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
  getKeyPair(secretKeyOrMnemonic) {
    return keyPairFromPhraseOrSecretKey(secretKeyOrMnemonic);
  }

  /** Connect Wallet Secret Key or Mnemonic */
  async connectWalletInteractive() {
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
      return this.connectWalletInteractive();
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

    const walletStateInit = getWalletStateInit(wallet);

    const { proof } = await this.buildWalletProof(wallet, keyPair.secretKey);

    const data = {
      publicKey,
      wallet: rawAddress,
      walletStateInit,
      network: "-239",
      proof,
    };

    this.debugger.log("Syncing ATF Wallet:", data);

    let attempts = 0;

    while (true) {
      const result = await this.syncWallet(data);
      const isBusy = result.busy || result.status === "busy";

      if (isBusy && attempts < MAX_SYNC_ATTEMPTS) {
        attempts++;
        this.logger.warn("Server is busy, retrying...");
        await this.utils.delayForSeconds(2, { signal: this.signal });
        continue;
      }

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
  }

  /** Build Wallet Proof */
  async buildWalletProof(wallet, secretKey) {
    const proofPayloadData = await this.getWalletProofPayload();
    const payload = proofPayloadData.payload;

    const { proof } = await buildTonProof({
      wallet,
      secretKey,
      domain: "atftoken.com",
      payload,
    });

    return { payload, proof };
  }

  /** Whether a rejected withdrawal was rejected over the captcha, using the app's own retry list */
  isWithdrawalCaptchaRejection(result) {
    const reason = String(result?.["reason"] || "");

    return (
      reason.startsWith("captcha") ||
      reason.startsWith("puzzle_") ||
      reason.startsWith("challenge_") ||
      reason === "trace_invalid"
    );
  }

  /** The drop grades an answer that came back too fast as a bot */
  async waitForCaptchaSolveTime(challenge, issuedAt) {
    const minSolveMs = Number(challenge["min_solve_ms"]) || 0;
    const remaining = minSolveMs - (Date.now() - issuedAt);

    await this.utils.delay(Math.max(2000, remaining), {
      precised: true,
      signal: this.signal,
    });
  }

  /** What to put above the captcha image, once a previous answer was rejected */
  buildCaptchaPromptText(challenge, rejection) {
    if (!rejection) {
      return "Solve the captcha to proceed with the withdrawal:";
    }

    const attemptsLeft = Number(
      challenge["attempts_left"] ?? rejection["attempts_left"],
    );

    return Number.isFinite(attemptsLeft)
      ? `${rejection["message"]} ${attemptsLeft} attempt(s) left:`
      : `${rejection["message"]} Try again:`;
  }

  /** Resolve one image captcha answer, falling back to asking the user when no provider solves it */
  async resolveImageCaptchaAnswer({ image, promptText, label = "captcha" }) {
    if (this.canSolveImage()) {
      try {
        this.logger.info(`Solving ${label}...`);

        const answer = await this.solveImage({ body: image });

        this.logger.info(`Solved ${label}:`, answer);

        return answer;
      } catch (error) {
        this.logger.error(`Failed to solve ${label}:`, error);
      }
    }

    if (typeof this.promptInput !== "function") {
      throw new Error(
        "No captcha provider is configured and there is no way to ask for the answer!",
      );
    }

    const answer = await this.promptInput({
      type: "text",
      text: promptText,
      image,
    });

    this.logger.info("Your answer:", answer);

    return answer;
  }

  /** Resolve one withdrawal captcha answer. */
  resolveCaptchaAnswer(challenge, rejection) {
    return this.resolveImageCaptchaAnswer({
      image: challenge["captcha_image"],
      promptText: this.buildCaptchaPromptText(challenge, rejection),
      label: "withdrawal captcha",
    });
  }

  /** Ask for the withdrawal captcha until the drop accepts it */
  async requestWithdrawalWithCaptcha(amount) {
    let challenge = await this.getWithdrawalPuzzle(amount.toNumber());
    let issuedAt = Date.now();
    let rejection = null;
    let attempt = 0;

    while (true) {
      if (this.signal.aborted) {
        throw new Error("Withdrawal aborted");
      }

      attempt++;

      /** The drop can waive the captcha, leaving nothing to ask */
      let answer = "";

      /** The app always asks for an answer when an image comes back */
      if (challenge["is_captcha"] || challenge["captcha_image"]) {
        answer = await this.resolveCaptchaAnswer(challenge, rejection);

        /** An answer that comes back too fast is graded as a bot */
        await this.waitForCaptchaSolveTime(challenge, issuedAt);
      }

      const result = await this.requestWithdrawal({
        amount: amount.toNumber(),
        withdraw_captcha_id: challenge["challenge_id"],
        withdraw_captcha_answer: answer,
      });

      /** Success, or a refusal that answering again cannot fix */
      if (!this.isWithdrawalCaptchaRejection(result)) {
        return result;
      }

      rejection = result;
      this.logger.error("Captcha rejected:", result["message"]);

      if (result["locked"]) {
        this.logger.error(
          "Withdrawals are locked until",
          new Date(Number(result["lock_until"]) * 1000).toLocaleString(),
        );
        return result;
      }

      const attemptsLeft = Number(result["attempts_left"]);

      if (attemptsLeft <= 0) {
        this.logger.error("No captcha attempts left.");
        return result;
      }

      if (attempt >= WITHDRAWAL_CAPTCHA_ATTEMPTS) {
        this.logger.error(
          `Giving up after ${WITHDRAWAL_CAPTCHA_ATTEMPTS} failed captcha attempts.`,
        );
        return result;
      }

      /** The image is regenerated on every failure, so ask for the new one */
      this.logger.warn("Fetching a new captcha...");
      challenge = await this.getWithdrawalPuzzle(amount.toNumber());
      issuedAt = Date.now();
    }
  }

  /** Place withdrawal */
  async placeWithdrawal({ max, difference }) {
    const { user } = this.user_data;
    const balance = new Decimal(user["mined_balance"]);

    if (!user["wallet_public_key"]) {
      return this.skipWithdrawal("No wallet public key found!");
    }

    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
    });

    /** Record Navigation Batch */
    await this.recordNavigationBatch(1);

    /** Solve the withdrawal captcha, re-asking while the answer is rejected */
    const result = await this.requestWithdrawalWithCaptcha(amount);

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

      await this.notifyWithdrawal([
        ["Initial Balance", balance.toString()],
        ["Requested", result["requested_amount"]],
        ["To receive", result["send_amount"]],
        ["New Balance", result["new_balance"]],
        ["Withdraw ID", `<code>${result["withdraw_id"]}</code>`],
      ]);
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
    const BASE_RATE = new Decimal(10);
    const RATE_GROWTH = new Decimal("1.0181532961");

    return BASE_RATE.times(RATE_GROWTH.pow(level - 1)).floor();
  }

  /** Hash power exactly as the ATF app shows it: TH/s = rate / 50 */
  getMinerHashPower(level) {
    return this.getMinerRate(level).div(50);
  }

  getMinerCost(level) {
    if (level <= 1) return new Decimal(0);

    const REQ_GROWTH = new Decimal("1.0257185327");

    return new Decimal(100).times(REQ_GROWTH.pow(level - 2)).floor();
  }

  findLevelForAtf(atfAmount) {
    const amount = new Decimal(atfAmount);
    let level = 1;

    while (level < 680 && amount.gte(this.getMinerCost(level + 1))) {
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

  getMiningRewardParts(level, difficulty, exemptMinLevel, exemptMaxLevel) {
    const rate = this.getMinerRate(level);
    const divisor = this.getDifficultyDivisor(
      difficulty,
      level,
      exemptMinLevel,
      exemptMaxLevel,
    );

    return {
      rate,
      divisor,
      passivePerSecond: rate.div(divisor).div(86400),
      boostTapReward: rate.div(100000).div(divisor),
    };
  }

  /** When the mining cycle freezes, falling back to the app's 72h window from the cycle start */
  getMiningFreezeAt(user) {
    const freezesAt = Number(user["mining_freezes_at"]) || 0;
    if (freezesAt > 0) return freezesAt;

    const cycleStart =
      Number(user["mining_cycle_started_at"]) ||
      Number(user["last_mining_start"]) ||
      0;

    return cycleStart > 0 ? cycleStart + MAX_MINING_CYCLE_SECONDS : 0;
  }

  /** Keep the mining fields a start, claim or boost hands back */
  applyMiningState(result) {
    const user = this.user_data.user;

    for (const key of [
      "mining_cycle_started_at",
      "mining_freezes_at",
      "boost_ready_at",
      "boost_active_until",
      "boost_power_snapshot",
      "mining_difficulty_snapshot",
    ]) {
      if (result?.[key] !== undefined) {
        user[key] = result[key];
      }
    }

    /** A fresh segment is no longer frozen */
    user["mining_frozen"] = 0;
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
    const diffSnapshot =
      Number(user["mining_difficulty_snapshot"]) || difficulty;
    const { rate, divisor, passivePerSecond, boostTapReward } =
      this.getMiningRewardParts(
        level,
        diffSnapshot,
        exemptMinLevel,
        exemptMaxLevel,
      );
    const pendingReward = new Decimal(user["pending_reward"] || 0);

    /** Mining stops accruing at the freeze point, as the app counts it */
    const freezeAt = this.getMiningFreezeAt(user);
    const cappedNow = freezeAt > 0 ? Math.min(nowSec, freezeAt) : nowSec;
    const elapsed = Math.max(cappedNow - lastMiningStart, 0);
    const passiveReward = passivePerSecond.times(elapsed);

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
      boostReward = boostTapReward.times(boostSeconds).times(boostPower);
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
    await this.executeTask("Daily Interaction", () =>
      this.recordDailyInteraction(),
    );
    await this.executeTask("Mining", () => this.startOrClaimMining());
    await this.executeTask("Boost", () => this.applyBoost());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Extra Tasks", () => this.completeExtraTasks());
    await this.executeTask("Friends", () => this.claimFriendsRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
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

    /** Check for flagged withdrawals */
    const { flagged: hasFlagged } = await this.getWithdrawalGuard();

    /** Log flagged withdrawals */
    this.logger.keyValue("Flagged Withdrawals", hasFlagged ? "Yes" : "No", {
      valueStyle: hasFlagged
        ? this.logger.c.redBright
        : this.logger.c.greenBright,
    });

    if (hasFlagged) {
      this.logger.error(
        "You have flagged withdrawals in your history. Please check your account for details.",
      );
    } else {
      this.logger.success("No flagged withdrawals in your history.");
    }
  }

  getDailyMiningRateForLevel(level, diffData, diffSnapshot) {
    const { rate, divisor } = this.getMiningRewardParts(
      level,
      diffSnapshot || diffData.difficulty,
      diffData.exemptMinLevel,
      diffData.exemptMaxLevel,
    );
    return rate.div(divisor);
  }

  getDailyMiningRate(user, diffData) {
    return this.getDailyMiningRateForLevel(
      Number(user["miner_level"]),
      diffData,
      Number(user["mining_difficulty_snapshot"]) || diffData.difficulty,
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
    const isVerified = this.isUserVerified(user);

    this.logger.newline();
    this.logger.keyValue("Verified", isVerified ? "Yes" : "No", {
      valueStyle: isVerified
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    const isProtectionRevoked = this.isUserProtectionRevoked(user);
    const isDexBuyer = this.isUserQualifiedDexBuyer(user);

    this.logger.keyValue(
      "Buyer Protection",
      isProtectionRevoked ? "Revoked" : "Active",
      {
        valueStyle: isProtectionRevoked
          ? this.logger.c.redBright
          : this.logger.c.greenBright,
      },
    );
    this.logger.keyValue("DEX Buyer", isDexBuyer ? "Yes" : "No", {
      valueStyle: isDexBuyer
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    const exchange = this.getUserExchange(user);

    this.logger.keyValue(
      "Toobit",
      exchange ? exchange.uid || "Connected" : "Not connected",
      {
        valueStyle: exchange
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
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

  /** Whether the drop has verified the account */
  isUserVerified(user) {
    return Number(user["is_verified"]) === 1;
  }

  /** Whether the drop has revoked the account's buyer protection */
  isUserProtectionRevoked(user) {
    return Number(user["buyer_protection_revoked"]) === 1;
  }

  /** Whether the drop counts the account as a qualified DEX buyer */
  isUserQualifiedDexBuyer(user) {
    return Number(user["qualified_dex_buyer"]) === 1;
  }

  /** The exchange the account has linked on the drop, or null when none */
  getUserExchange(user) {
    if (Number(user["toobit_connected"]) !== 1) return null;

    return { name: "Toobit", uid: user["toobit_uid"] || null };
  }

  /** Whether the drop has banned the account */
  isUserBanned(user) {
    return Number(user["is_banned"]) === 1;
  }

  /** The account's own withdrawal queue, from one read of the history */
  async getAutoWithdrawals() {
    const history = await this.getWithdrawHistory();
    const items = history?.items || [];

    return {
      pending: items.filter((item) => item.status === "pending"),
      approved: items.filter((item) => item.status === "approved"),
      flagged: items.filter(
        (item) => !["pending", "approved"].includes(item.status),
      ),
    };
  }

  /** Both withdrawal gates, from the same read the queue uses */
  async getWithdrawalGuard() {
    const { pending, flagged } = await this.getAutoWithdrawals();

    return { pending: pending.length > 0, flagged: flagged.length > 0 };
  }

  /** The withdrawals the drop has not settled yet */
  async getPendingWithdrawals() {
    const { pending } = await this.getAutoWithdrawals();

    return pending;
  }

  /** Whether the drop still owes this account a settlement */
  async hasPendingWithdrawal() {
    const pending = await this.getPendingWithdrawals();

    return pending.length > 0;
  }

  /** Log the withdrawals the drop has not settled yet */
  async logPendingWithdrawals() {
    const pending = await this.getPendingWithdrawals();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue(
      "Verified",
      this.isUserVerified(this.getUserDetails()) ? "Yes" : "No",
    );
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    if (pending.length === 0) {
      this.logger.success("No withdrawal is awaiting processing.");
      return { status: true, pending };
    }

    for (const item of pending) {
      this.logger.newline();

      for (const [key, value] of Object.entries(item)) {
        if (value === null || typeof value === "object") {
          continue;
        }

        this.logger.keyValue(this.formatWithdrawalField(key), String(value), {
          format: false,
        });
      }
    }

    this.logger.newline();
    this.logger.warn(
      `${pending.length} withdrawal(s) still awaiting processing.`,
    );

    return { status: true, pending };
  }

  /** `send_amount` -> `Send Amount` */
  formatWithdrawalField(key) {
    return key
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
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

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Connect a TON wallet, optionally re-reading the account afterwards */
  async connectAutoWallet({ phrase, version, refresh = false }) {
    try {
      const keyPair = await this.getKeyPair(phrase);
      const { status, message } = await this.connectAndSyncWallet(
        keyPair,
        `v${version}`,
      );

      if (!status) {
        return { status: false, message };
      }

      return {
        status: true,
        summary: refresh
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Claim pending mining so the summary reflects the current balance */
  async refreshAutoState() {
    return this.startOrClaimMining();
  }

  /** Log in again for a fresh summary, since only a forced login re-reads the wallet on-chain */
  async refreshAutoSummary() {
    await this.login(true);
    return this.getAutoSummary();
  }

  /** Start mining and report the account afresh, after a boost has landed so the level is snapshotted */
  async startAutoMining() {
    await this.startOrClaimMining();
    await this.applyBoost();
    await this.claimFriendsRewards();
    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.getUserDetails();
    const flags = (user["risk_flags"] || "").trim().split("|").filter(Boolean);
    const wallet = user["wallet_public_key"] ? this.getUserWallet(user) : null;

    return {
      level: user["miner_level"],
      mining: {
        startedAt: Number(user["last_mining_start"]) || 0,
        freezesAt: Number(user["mining_freezes_at"]) || 0,
        frozen: user["mining_frozen"] === 1,
      },
      holding: user["wallet_holding_atf"],
      balance: user["mined_balance"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: this.isUserVerified(user),
      protection: {
        revoked: this.isUserProtectionRevoked(user),
        dexBuyer: this.isUserQualifiedDexBuyer(user),
      },
      wallet: wallet
        ? { address: wallet.address, version: wallet.version }
        : null,
      exchange: this.getUserExchange(user),
      banned: this.isUserBanned(user),
      banReason: user["banned_reason"],
      risk: {
        score: user["risk_score"],
        updatedAt: user["risk_updated_at"],
        flags,
      },
    };
  }

  async registerToToobit() {
    window.open(
      "https://www.toobit.com/en-US/register?invite_code=atffamily&activityId=1361",
      "_blank",
    );
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
    const hashPower = this.getMinerHashPower(level);
    const divisor = this.getDifficultyDivisor(
      diffData.difficulty,
      level,
      diffData.exemptMinLevel,
      diffData.exemptMaxLevel,
    );

    this.logger.newline();
    this.logger.keyValue("ATF Amount", amount.toString());
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue("Level Cost", this.getMinerCost(level).toString());
    this.logger.keyValue(
      "Hash Power",
      `${hashPower.toDecimalPlaces(2).toString()} TH/s`,
    );
    this.logger.keyValue("Difficulty", diffData.difficulty);
    this.logger.keyValue("Divisor", divisor.toDecimalPlaces(4).toString());

    this.logger.newline();
    this.logMiningRateBreakdown(dailyRate);
    this.logHashPowerExplainer(hashPower, divisor);
  }

  /** Disconnect the wallet the way the app's disconnect button does, which settles and stops mining */
  async disconnectWalletInteractive() {
    const wallet = this.user_data?.user?.["wallet_address"];

    if (!wallet) {
      this.logger.warn("No wallet connected.");
      return;
    }

    const confirm = await this.promptInput({
      type: "select",
      text: "Disconnecting settles and stops mining. Continue?",
      options: [
        { value: "no", label: "Cancel" },
        { value: "yes", label: "Disconnect" },
      ],
    });

    if (confirm !== "yes") return;

    try {
      const result = await this.disconnectWallet(wallet);

      if (result.status !== "success") {
        this.logger.error(result.message || "Failed to disconnect wallet");
        return;
      }

      if (result.user) {
        this.user_data.user = result.user;
      }
      this.logger.success("Wallet disconnected!");
    } catch (error) {
      this.logger.error(error?.response?.data?.message || error.message);
    }
  }

  async logToobitStatus() {
    try {
      const data = await this.getToobitStatus();

      if (data.status !== "success") {
        this.logger.error(data.message);
        return;
      }

      const connected = Number(data.connected) === 1;

      this.logger.keyValue("Connected", connected ? "Yes" : "No", {
        valueStyle: connected
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      });
      this.logger.keyValue("UID", data.uid || "-", { format: false });
    } catch (error) {
      this.logger.error(error?.response?.data?.message || error.message);
    }
  }

  async disconnectToobitInteractive() {
    try {
      const data = await this.disconnectToobitUid();

      if (data.status !== "success") {
        this.logger.error(data.message);
        return;
      }

      Object.assign(this.user_data.user, {
        toobit_connected: Number(data.connected) || 0,
        toobit_uid: data.uid || "",
      });
      this.logger.success(data.message || "Toobit disconnected!");
    } catch (error) {
      this.logger.error(error?.response?.data?.message || error.message);
    }
  }

  async connectToobitUser() {
    const input = await this.promptInput("Enter Toobit UID:");
    const uid = (input || "").trim();

    if (!uid) return;

    try {
      const { status, message } = await this.connectToobitUid(uid);
      if (status !== "success") {
        this.logger.error(message);
        return;
      }
      this.logger.success("Toobit connected!");
    } catch (error) {
      const message = error?.response?.data?.message || error.message;
      this.logger.error(message);
      return;
    }
  }

  async checkToobitKycInteractive() {
    const data = await this.checkToobitKyc();
    const { status, message } = data;

    if (status !== "success") {
      this.logger.error(message);
      return;
    } else {
      this.logger.keyValue("Connected", data.connected);
      this.logger.keyValue("UID", data.uid, { format: false });
      this.logger.keyValue("KYC Verified", data.kyc_verified);
      this.logger.keyValue("Whitelisted", data.whitelisted);
      this.logger.keyValue("Restored Withdrawals", data.restored_withdrawals);
      this.logger.keyValue("Reserved Withdrawals", data.reserved_withdrawals);
      this.logger.keyValue("Message", data.message);
    }
    this.logger.success("Toobit KYC checked!");
  }

  /** Explain the TH/s figure the ATF app advertises */
  logHashPowerExplainer(hashPower, divisor) {
    const base = hashPower.times(50);

    this.logger.newline();
    this.logger.info("What is TH/s?");
    this.logger.debug(
      "TH/s (terahashes per second) is only how the app labels a miner's speed;",
    );
    this.logger.debug(
      "nothing is actually hashed. It is the level's base rate divided by 50:",
    );
    this.logger.debug(
      `  ${hashPower.toDecimalPlaces(2).toString()} TH/s x 50 = ${base.toString()} ATF/day at difficulty 1.`,
    );
    this.logger.debug(
      `  Network difficulty then divides that: ${base.toString()} / ${divisor.toDecimalPlaces(4).toString()} = ${this.formatAmount(base.div(divisor))} ATF/day.`,
    );
    this.logger.debug(
      "So a higher TH/s always means a faster miner, but the ATF it actually pays",
    );
    this.logger.debug(
      "drops as difficulty rises. The rates above already include difficulty.",
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
      await this.utils.delayForSeconds(5, { signal: this.signal });

      const result = await this.startMining({
        challengeId: challenge.challenge_id,
        answer: answer.toString(),
      });

      if (result.start_time) {
        Object.assign(this.user_data.user, {
          last_mining_start: result.start_time,
          boost_active_until: 0,
          boost_power_snapshot: 0,
          mining_difficulty_snapshot: 0,
        });
        this.applyMiningState(result);
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
      await this.utils.delayForSeconds(5, { signal: this.signal });

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
        Object.assign(this.user_data.user, {
          last_mining_start: result.server_now,
          pending_reward: 0,
          boost_active_until: 0,
          boost_power_snapshot: 0,
          mining_difficulty_snapshot: 0,
        });
        this.applyMiningState(result);
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

    /** The app keeps the boost locked until it is ready again */
    const boostReadyAt = Number(user["boost_ready_at"]) || 0;

    if (boostReadyAt > nowSec) {
      this.logger.info("Boost not ready yet.");
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

    /* Record navigation batch */
    await this.recordNavigationBatch(1);

    /** Delay before activating */
    await this.utils.delayForSeconds(3, { signal: this.signal });

    const result = await this.activateBoost(balance);

    if (result.boost_active_until) {
      /** A boost settles the session into pending and opens a new segment */
      Object.assign(this.user_data.user, {
        pending_reward: balance.toNumber(),
        last_mining_start:
          Number(result.server_now) || Math.floor(Date.now() / 1000),
        boost_power_snapshot:
          Number(result.boost_taps_per_sec) || diffData.boostTapsPerSec,
        mining_difficulty_snapshot: diffData.difficulty,
      });
      this.applyMiningState(result);
      this.logger.success("Boost activated!");
    }
  }

  /** Apply the balance and level a claim hands back, keeping what it leaves out */
  applyClaimResult(result, balanceKey = "new_balance") {
    const user = this.user_data.user;

    if (result?.[balanceKey] !== undefined) {
      user["mined_balance"] = result[balanceKey];
    }
    if (result?.["new_level"] !== undefined) {
      user["miner_level"] = result["new_level"];
    }
    if (result?.["assets_total"] !== undefined) {
      user["assets_total"] = result["assets_total"];
    }
  }

  async completeTasks() {
    /** Record Navigation Batch */
    await this.recordNavigationBatch(1);

    const { user } = this.user_data;
    const completedTasks = user.completed_tasks || [];

    const availableTasks = ONE_TIME_TASKS.filter(
      (task) => !completedTasks.includes(task.id),
    );

    /** Complete Available Tasks */
    for (const task of availableTasks) {
      if (this.signal.aborted) break;

      try {
        /** Telegram joins are checked by the bot */
        if (task.link) {
          await this.tryToJoinTelegramLink(task.link);
        }

        const result = await this.claimTask(task.id, 0);

        if (result.status !== "success") {
          this.logger.error(`Failed to claim ${task.id}:`, result.message);
        } else {
          this.applyClaimResult(result);
          completedTasks.push(task.id);
          this.logger.success(`Claimed task: ${task.id}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to claim ${task.id}:`,
          error.response?.data?.message || error.message,
        );
      }

      await this.utils.delayForSeconds(20, { signal: this.signal });
    }
  }

  /** Complete Extra Tasks, each on its own cooldown */
  async completeExtraTasks() {
    const cooldowns = this.user_data["task_cooldowns"] || {};
    const nowSec = Math.floor(Date.now() / 1000);

    const availableTasks = COOLDOWN_TASKS.filter(
      (task) => !(Number(cooldowns[task.id]) > nowSec),
    );

    if (availableTasks.length === 0) {
      this.logger.warn("Extra tasks not available");
      return;
    }

    /** Record Navigation Batch */
    await this.recordNavigationBatch(1);

    for (const task of availableTasks) {
      if (this.signal.aborted) break;

      try {
        /** The claim is checked against the start the app registered */
        const startedAt = Math.floor(Date.now() / 1000);

        await this.startTask(task.id, startedAt);
        await this.utils.delayForSeconds(
          task.minSeconds + 5 + Math.floor(Math.random() * 15),
          { signal: this.signal },
        );

        const result = await this.claimTask(task.id, startedAt);

        if (result.status !== "success") {
          this.logger.error(`Failed to complete ${task.id}:`, result.message);
        } else {
          this.applyClaimResult(result);
          this.logger.success(`Completed task: ${task.id}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to complete ${task.id}:`,
          error.response?.data?.message || error.message,
        );
      }

      await this.utils.delayForSeconds(10, { signal: this.signal });
    }
  }

  /** Claim Friends Rewards */
  async claimFriendsRewards() {
    /** Record Navigation Batch */
    await this.recordNavigationBatch(1);

    const friends = await this.getFriends();
    const claimable = friends.claimable;
    const teamWallet = friends.team_wallet;

    if (claimable > 0) {
      const result = await this.claimReferrals();

      this.applyClaimResult(result);

      this.logger.success(`Claimed ${claimable} ATF from referrals!`);
      await this.utils.delayForSeconds(2, { signal: this.signal });
    } else {
      this.logger.info("No referral rewards to claim.");
    }

    if (teamWallet > 0) {
      /** Only the pool balance comes back, the level is left as it was */
      const result = await this.claimTeamWallet();

      this.applyClaimResult(result, "new_pool_balance");

      this.logger.success(
        `Claimed ${result.claimed_amount ?? teamWallet} ATF from team wallet!`,
      );
      await this.utils.delayForSeconds(2, { signal: this.signal });
    } else {
      this.logger.info("No team wallet rewards to claim.");
    }
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    const friends = await this.getFriends();
    return friends.total || 0;
  }
}
