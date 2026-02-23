import { deriveEd25519Path, keyPairFromSeed } from "@ton/crypto";

import BaseFarmer from "../lib/BaseFarmer.js";
import { Wallet } from "ethers/wallet";
import { WalletContractV4 } from "@ton/ton";

export default class PirateCashFarmer extends BaseFarmer {
  static id = "pirate-cash";
  static title = "Pirate Cash";
  static emoji = "🐙";
  static host = "game.p.cash";
  static domains = ["game.p.cash", "p.cash"];
  static telegramLink = "https://t.me/piratecash_bot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static deactivateOnError = false;
  static rating = 5;
  static interval = "*/30 * * * *";
  static channels = [
    { name: "pcash", check: "piratecash" },
    { name: "PirateCash_ENG", check: "pcash" },
    { name: "Cosanta_io", check: "cosanta" },
    { name: "wdash", check: "wdash" },
    { name: "cosanta_eng", check: "cosanta_group" },
  ];

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/piratecash_bot?start=${this.getUserId()}`;
  }

  /** Get Auth */
  async fetchAuth() {
    /** Get System Info */
    await this.getSystemInfo();

    /** Register or Login User */
    const { tokens, user } = await this.api
      .post("https://p.cash/miniapp/users", { sign: this.getInitData() })
      .then((res) => res.data);

    /** Retrieve Auth Tokens */
    const { accessToken, refreshToken } = await this.api
      .put("https://p.cash/miniapp/users/auth", null, {
        headers: { Authorization: `Bearer ${tokens.refreshToken}` },
      })
      .then((res) => res.data);

    this._userData = { tokens, user };
    this._authData = { accessToken, refreshToken };

    return this._authData;
  }

  /** Get Meta */
  fetchMeta() {
    return this.api
      .get("https://p.cash/api/coins/piratecash")
      .then((res) => res.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.accessToken}`,
    };
  }

  /** Complete Onboarding */
  completeOnboarding(signal = this.signal) {
    return this.api
      .patch("https://p.cash/miniapp/users/onboarding", null, { signal })
      .then((res) => res.data);
  }

  getLoggedInUser(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/users", { signal })
      .then((res) => res.data.user);
  }

  getSystemInfo(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/system/info", { signal })
      .then((res) => res.data);
  }

  getCaptcha(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/users/captcha", { signal })
      .then((res) => res.data);
  }

  getPCashWalletBalance({ uniqueCode, evmAddress }, signal = this.signal) {
    return this.api
      .post(
        "https://p.cash/miniapp/users/wallet/pcash/balance",
        { uniqueCode, evmAddress, apiVersion: 2 },
        { signal },
      )
      .then((res) => res.data);
  }

  submitCaptcha(code, signal = this.signal) {
    return this.api
      .post("https://p.cash/miniapp/users/captcha", { code }, { signal })
      .then((res) => res.data);
  }

  submitPCashWallet(data, signal = this.signal) {
    return this.api
      .post("https://p.cash/miniapp/users/wallet/pcash", data, { signal })
      .then((res) => res.data);
  }

  /** Get Skins */
  getSkins(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/skins", { signal })
      .then((res) => res.data);
  }

  /** Get Active Skin */
  getActiveSkin(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/skins/active", { signal })
      .then((res) => res.data);
  }

  getActiveSwap(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/swaps/active", { signal })
      .then((res) => res.data);
  }

  getSwapSubscriptions(signal = this.signal) {
    return this.api
      .get(
        "https://p.cash/miniapp/swaps/list-subscriptions?subscriptions=all",
        { signal },
      )
      .then((res) => res.data);
  }

  /** Activate Skin */
  activateSkin(skinId, signal = this.signal) {
    return this.api
      .put(`https://p.cash/miniapp/skins/${skinId}`, null, { signal })
      .then((res) => res.data);
  }

  /** Get Onboardings */
  getOnboardings(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/onboardings", { signal })
      .then((res) => res.data);
  }

  /** Get Leagues */
  getLeagues(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/leagues", { signal })
      .then((res) => res.data);
  }

  /** Tap Coin */
  tapCoin(amount, signal = this.signal) {
    return this.api
      .post("https://p.cash/miniapp/taps", { amount }, { signal })
      .then((res) => res.data);
  }

  /** Set Wallet Address */
  setWalletAddress(walletAddress, signal = this.signal) {
    return this.api
      .post(
        "https://p.cash/miniapp/users/wallet",
        { walletAddress },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Force Check Subscriptions */
  forceCheckSubscriptions(channel, signal = this.signal) {
    return this.api
      .post(
        "https://p.cash/miniapp/users/force-check",
        {
          ["channel_name"]: channel,
        },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Start Farming */
  startFarming(signal = this.signal) {
    return this.api
      .post("https://p.cash/miniapp/stakings", null, { signal })
      .then((res) => res.data);
  }

  /** Get Farming */
  getFarming(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/stakings", { signal })
      .then((res) => res.data);
  }

  /** Claim Farming */
  claimFarming(signal = this.signal) {
    return this.api
      .patch("https://p.cash/miniapp/stakings", null, { signal })
      .then((res) => res.data);
  }

  createTools() {
    return [
      {
        name: "Mini-App connection",
        list: [
          {
            id: "connect-mini-app",
            emoji: "🔗",
            title: "Connect Mini-App (NEW Wallet)",
            action: this.connectMiniApp.bind(this),
            dispatch: false,
          },
          {
            id: "check-mini-app-connection",
            emoji: "🔍",
            title: "Check Mini-App Connection",
            action: this.checkMiniAppConnection.bind(this),
          },
        ],
      },
      {
        name: "P.CASH Wallet",
        list: [
          {
            id: "create-pcash-wallet",
            emoji: "🪙",
            title: "Create P.CASH Wallet (NEW)",
            action: this.generatePCashWallet.bind(this),
            dispatch: false,
          },
          {
            id: "create-pcash-wallet-from-phrase",
            emoji: "🪙",
            title: "Create P.CASH Wallet from Phrase",
            action: this.generatePCashWalletFromPhrase.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Device data",
        list: [
          {
            id: "import-connection-data",
            emoji: "📁",
            title: "Import Connection Data from JSON",
            action: this.importConnectionData.bind(this),
            dispatch: false,
          },
          {
            id: "solve-connection-captcha",
            emoji: "🔐",
            title: "Solve Connection Captcha",
            action: this.solveConnectionCaptcha.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  async createPCashWallet() {
    const ethWallet = Wallet.createRandom();
    return this.derivePCashWallet(ethWallet);
  }

  async createPCashWalletFromPhrase(mnemonic) {
    const ethWallet = Wallet.fromPhrase(mnemonic);

    return this.derivePCashWallet(ethWallet);
  }

  /**
   * Derive PCash Wallet from Ethereum Wallet
   * @param {import("ethers").HDNodeWallet} ethWallet
   */
  async derivePCashWallet(ethWallet) {
    // TON — BIP39 seed → SLIP-0010 Ed25519 at m/44'/607'/0'
    const seed = Buffer.from(ethWallet.mnemonic.computeSeed().slice(2), "hex");
    let privKey = await deriveEd25519Path(seed, [44, 607, 0]);
    const { publicKey } = keyPairFromSeed(privKey);

    const tonAddressV4 = WalletContractV4.create({
      workchain: 0,
      publicKey,
    }).address.toString({ bounceable: false });

    return {
      phrase: ethWallet.mnemonic.phrase,
      ethAddress: ethWallet.address.toLowerCase(),
      tonAddress: tonAddressV4,
    };
  }

  async getSwapWalletAddress() {
    const { quests } = await this.api
      .get("https://p.cash/miniapp/swaps/active")
      .then((res) => res.data);

    this.logger.debug(`🔄 Your swap wallet address is:`);
    this.logger.success(quests.wallet.data.walletAddress);
  }

  async generatePCashWalletFromPhrase() {
    const mnemonic = await this.promptInput(
      "Enter your 12-word mnemonic phrase:",
    );

    if (!mnemonic) {
      this.logger.warn("⚠️ Mnemonic phrase not provided. Skipping...");
      return null;
    }

    this.logger.info(`🔄 Generating PCash wallet from provided mnemonic...`);
    this.logger.newline();

    const { phrase, ethAddress, tonAddress } =
      await this.createPCashWalletFromPhrase(mnemonic);

    this.logPCashWalletInfo({ phrase, ethAddress, tonAddress });
  }

  async generatePCashWallet() {
    const { phrase, ethAddress, tonAddress } = await this.createPCashWallet();

    this.logPCashWalletInfo({ phrase, ethAddress, tonAddress });
  }

  logPCashWalletInfo({ phrase, ethAddress, tonAddress }) {
    this.logger.debug(`🔄 Your PCash wallet information:`);
    this.logger.keyValue("Mnemonic Phrase", phrase);
    this.logger.newline();

    this.logger.keyValue("Ethereum Address", ethAddress);
    this.logger.newline();

    this.logger.keyValue("TON Address", tonAddress);
    this.logger.newline();
  }

  async configureWalletAddress() {
    const walletAddress = await this.promptInput("Enter your wallet address:");

    if (!walletAddress) {
      this.logger.warn("⚠️ Wallet address not provided. Skipping...");
      return null;
    }
    this.logger.info(`🔄 Setting wallet address ${walletAddress}...`);
    await this.setWalletAddress(walletAddress);
    this.logger.success("✅ Wallet address set successfully!");
  }

  async solveConnectionCaptcha() {
    const captchaData = await this.getCaptcha();

    if (!captchaData || !captchaData["image_base64"]) {
      this.logger.warn("⚠️ No captcha available. Skipping...");
      return;
    }

    this.logger.info("🔄 Please solve the captcha:");
    const userInput = await this.promptInput({
      type: "text",
      text: "Enter the captcha code:",
      image: captchaData["image_base64"],
    });

    if (!userInput) {
      this.logger.warn("⚠️ Captcha code not provided. Skipping...");
      return;
    }

    try {
      const result = await this.submitCaptcha(userInput);
      if (!result.valid) {
        throw new Error("Invalid captcha code");
      }
      this.logger.success("✅ Captcha solved successfully!");
    } catch (err) {
      this.logger.error("❌ Failed to solve captcha. Please try again.");
    }
  }

  /** Process Farmer */
  async process() {
    const { user } = this._userData;
    const leagues = await this.getLeagues();
    const skins = await this.getSkins();
    const activeSkin = await this.getActiveSkin();

    const currentLeague = leagues.findLast(
      (league) => league.achievedAt !== null,
    );

    this.logUserInfo(user);
    await this.executeTask("Onboarding", () => this.skipOnboarding(user));
    await this.executeTask("Check Profile", () => this.checkProfile(user));
    await this.executeTask("Upgrade Skin", () =>
      this.upgradeSkin({ skins, currentLeague }),
    );
    await this.executeTask("Farming", () =>
      this.checkFarming({ currentLeague }),
    );
    await this.executeTask("Channels", () => this.joinRequiredChannels(user));
    await this.executeTask("Tap Game", () => this.tapGame(user));
  }

  async selectDevice() {
    this.logger.info(
      "Visit GSMArena to find a compatible device: https://www.gsmarena.com/makers.php3",
    );
    await this.utils.delayForSeconds(1);
    window.open("https://www.gsmarena.com/makers.php3", "_blank");

    /* Prompt user to enter device name */
    const selectedDevice = await this.promptInput(
      "Enter the device name (e.g. Samsung Galaxy S21)",
    );

    if (!selectedDevice) {
      this.logger.warn("⚠️ Device name not provided. Skipping...");
      throw new Error("Device name is required!");
    }

    /* Log selected device and add delay for better UX */
    this.logger.info(`🔄 You selected: ${selectedDevice}`);
    await this.utils.delayForSeconds(1);

    const versions = [
      { name: "Android 9", sdk: 28 },
      { name: "Android 10", sdk: 29 },
      { name: "Android 11", sdk: 30 },
      { name: "Android 12", sdk: 31 },
      { name: "Android 13", sdk: 33 },
      { name: "Android 14", sdk: 34 },
      { name: "Android 15", sdk: 35 },
      { name: "Android 16", sdk: 36 },
    ];

    /* Prompt user to select Android version */
    const selectedSdk = await this.promptInput({
      text: "Select the Android version:",
      type: "select",
      options: versions.map((v) => ({
        label: v.name,
        value: v.sdk,
      })),
    });

    const selectedVersion = versions.find(
      (v) => v.sdk === parseInt(selectedSdk),
    );

    if (!selectedVersion) {
      this.logger.warn("⚠️ Android version not selected. Skipping...");
      throw new Error("Android version selection is required!");
    }

    /* Log selected version and add delay for better UX */
    this.logger.info(
      `🔄 You selected ${selectedVersion.name} (SDK ${selectedVersion.sdk})`,
    );
    await this.utils.delayForSeconds(1);

    return {
      name: selectedDevice,
      version: selectedVersion.name,
      sdk: selectedVersion.sdk,
    };
  }

  async checkMiniAppConnection() {
    const swap = await this.getActiveSwap();
    const connectedWallet = swap.quests.wallet.data;

    if (connectedWallet.walletAddress) {
      this.logger.warn(`✅ Your mini-app is already connected!`);
      this.logger.newline();
      this.logMiniAppConnection(connectedWallet);
    } else {
      this.logger.warn(`⚠️ Your mini-app is not connected yet!`);
    }
  }

  logMiniAppConnection(connectedWallet) {
    this.logger.keyValue("Ethereum Wallet", connectedWallet.premiumAddress);
    this.logger.newline();
    this.logger.keyValue("TON Wallet", connectedWallet.walletAddress);
    this.logger.newline();
  }

  /** Connect MiniApp */
  async connectMiniApp() {
    const swap = await this.getActiveSwap();
    const connectedWallet = swap.quests.wallet.data;

    if (connectedWallet.walletAddress) {
      this.logger.warn(`⚠️ Your mini-app is already connected!`);
      this.logger.newline();
      this.logMiniAppConnection(connectedWallet);
      return;
    }

    this.logger.info(
      `🔄 To connect the miniapp, we need to generate some device data. Let's start by selecting a random device:`,
    );
    await this.utils.delayForSeconds(1);

    const device = await this.selectDevice();

    const wallet = await this.createPCashWallet();
    this.logPCashWalletInfo(wallet);

    /* Simulate device data collection and captcha solving before connecting the wallet */
    const details = await this.generateDeviceData(device, wallet);

    this.logger.debug("🔄 Device data generated successfully!");
    this.logger.info(JSON.stringify(details, null, 2));

    await this.utils.delayForSeconds(1);
    await this.solveConnectionCaptcha();
    await this.utils.delayForSeconds(1);

    const connection = await this.submitPCashWallet(details);

    this.logger.success("✅ MiniApp connected successfully!");
    this.logger.debug("🔄 Connection details:");
    this.logger.info(JSON.stringify(connection, null, 2));

    /* Download device data and connection details as JSON file for user reference */
    const filename = `piratecash_device_data_${this.getUserId()}_${Date.now()}.json`;

    this.utils.downloadFile(filename, {
      device,
      wallet,
      details,
      connection,
    });

    this.logger.info(
      `📥 Device data and connection details saved as ${filename}`,
    );
    this.logger.warn(
      "⚠️ Make sure to keep this file safe, it contains information which will be required for future operations!",
    );
  }

  /* Import Connection Data from JSON file */
  async importConnectionData() {
    const data = await this.promptInput({
      type: "file",
      text: "Upload the generated device data JSON file",
      fileTitle: "device data file",
    });

    if (!data) {
      this.logger.warn("⚠️ No file uploaded. Skipping...");
      return;
    }

    /* Log imported data for user reference */
    this.logger.keyValue("Device", data.device.name);
    this.logger.keyValue("Android Version", data.device.version);
    this.logger.keyValue("SDK Version", data.device.sdk);
    this.logger.newline();

    /** Log PCash Wallet Info */
    this.logPCashWalletInfo(data.wallet);

    /** Log Device Data */
    this.logger.debug("🔄 Imported device data:");
    this.logger.info(JSON.stringify(data.details, null, 2));
  }

  /**
   * Generate a random float between min and max with 7 significant digits
   */
  randomFloat(min, max) {
    return parseFloat((min + Math.random() * (max - min)).toPrecision(7));
  }

  /**
   * Simulate realistic gyroscope data (rad/s)
   * A phone at rest has near-zero angular velocity with small sensor noise
   */
  randomGyro() {
    return {
      x: this.randomFloat(-0.005, 0.005),
      y: this.randomFloat(-0.005, 0.005),
      z: this.randomFloat(-0.005, 0.005),
    };
  }

  /**
   * Simulate realistic accelerometer data (m/s²)
   * Gravity (~9.81) is distributed across axes depending on phone orientation
   * Simulates a phone held in hand at a natural angle
   */
  randomAccelerometer() {
    const gravity = 9.81;
    // Random tilt angles (radians) — phone held somewhat upright
    const tiltX = this.randomFloat(-0.4, 0.4); // slight side tilt
    const tiltY = this.randomFloat(0.3, 1.2); // mostly upright

    return {
      x: gravity * Math.sin(tiltX) + this.randomFloat(-0.3, 0.3),
      y: gravity * Math.cos(tiltY) + this.randomFloat(-0.3, 0.3),
      z: gravity * Math.sin(tiltY) + this.randomFloat(-0.3, 0.3),
    };
  }

  /**
   * Simulate realistic gyroscope variance
   * Very small values — sensor noise variance when stationary
   */
  randomGyroVariance() {
    return {
      x: this.randomFloat(1e-5, 1e-3),
      y: this.randomFloat(1e-5, 1e-3),
      z: this.randomFloat(1e-5, 1e-3),
    };
  }

  /**
   * Simulate realistic accelerometer variance
   * Small values — micro-movements from hand tremor
   */
  randomAccelerometerVariance() {
    return {
      x: this.randomFloat(0.001, 0.05),
      y: this.randomFloat(0.001, 0.05),
      z: this.randomFloat(0.001, 0.05),
    };
  }

  generateDeviceData(device, wallet) {
    const isCharging = Math.random() < 0.3;

    return {
      walletAddress: wallet.tonAddress,
      premiumAddress: wallet.ethAddress,
      pirate: "0.00000000",
      cosa: "0.00000000",
      uniqueCode: null,
      gyro: this.randomGyro(),
      accelerometer: this.randomAccelerometer(),
      gyroVariance: this.randomGyroVariance(),
      accelerometerVariance: this.randomAccelerometerVariance(),
      batteryPercent: 10 + Math.floor(Math.random() * 90),
      isCharging: isCharging,
      chargingType: isCharging ? "USB" : "NONE",
      isUsbConnected: isCharging,
      deviceModel: device.name,
      osVersion: device.version,
      sdkVersion: device.sdk,
      hasGyroscope: true,
      hasAccelerometer: true,
      emulator: false,
      isMoving: true,
      isHandHeld: true,
      isDev: false,
      isAdb: false,
      isRooted: false,
      collectionDurationMs: 10_000 + Math.floor(Math.random() * 30_000),
      sampleCount: 100 + Math.floor(Math.random() * 400),
      apiVersion: 2,
    };
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user.balance / Math.pow(10, 8));
    this.logger.keyValue("Energy", user.energy);
    this.logger.keyValue(
      "Cheater",
      user["cheater_status"] !== "normal" ? "Yes 🚫" : "No ✅",
    );
  }

  /** Skip Onboarding */
  async skipOnboarding(user) {
    if (!user.isOnboardingPassed) {
      await this.completeOnboarding();
      this.logger.success(`✅ Onboarding completed successfully!`);
    }
  }

  /** Join Required Channels */
  async joinRequiredChannels(user, signal = this.signal) {
    const { quests } = await this.getSwapSubscriptions();

    for (const key in quests) {
      /** Get status */
      const status = quests[key];

      /** Find channel */
      const channel = this.constructor.channels.find(
        (item) => item.check === key,
      );

      if (!channel || status.isCompleted) continue;

      /* Join Telegram Channel */
      await this.tryToJoinTelegramLink(`https://t.me/${channel.name}`);
      this.logger.info(`✅ Joined @${channel.name} successfully!`);

      /* Force Check Subscription */
      await this.forceCheckSubscriptions(channel.check);
      this.logger.info(`🔄 Checked @${channel.name} subscription status!`);

      /* Random delay between joins to mimic human behavior */
      await this.utils.delayForSeconds(4, { signal });
    }
  }

  /** Tap Game */
  async tapGame(user, signal = this.signal) {
    let energy = user.energy;

    while (energy > 0) {
      /* Determine tap amount (random between 10 and 40, but not exceeding available energy) */
      const tapAmount = Math.min(energy, 10 + Math.floor(Math.random() * 30));

      /* Tap Coins */
      const result = await this.tapCoin(tapAmount);
      energy = result.energy;
      this.logger.info(`🪙 Tapped ${tapAmount} coins. [${energy}] energy left`);

      /* Random delay between taps to mimic human behavior */
      await this.utils.delayForSeconds(3, { signal });
    }
  }

  async upgradeSkin({ skins, currentLeague }) {
    if (currentLeague) {
      const leagueSkin = skins.find(
        (skin) => skin.conditions.league === currentLeague.id,
      );
      if (leagueSkin && !leagueSkin.isActive) {
        await this.activateSkin(leagueSkin.id);
        this.logger.success(
          `✅ Activated ${leagueSkin.name.toUpperCase()} skin successfully!`,
        );
      }
    }
  }

  /** Check Profile */
  async checkProfile(user) {
    const { lastName = "" } = user;
    const word = "PIRATE🏴‍☠💰";

    if (!lastName.startsWith(word)) {
      await this.tryToUpdateProfile({ lastName: `${word} ${lastName}` });
      this.logger.success(`✅ Updated profile successfully!`);
    }
  }

  /** Check Farming */
  async checkFarming({ currentLeague }) {
    if (currentLeague.id < 2) {
      this.logger.info("Farming is available from League 2 and above.");
      return;
    }

    const farming = await this.getFarming().catch(() => null);
    const systemInfo = await this.getSystemInfo();

    if (!farming) {
      await this.startFarming();
      this.logger.success(`✅ Started farming successfully!`);
    } else if (
      this.utils.dateFns.isAfter(
        new Date(systemInfo.time),
        new Date(farming.finishAt),
      )
    ) {
      await this.claimFarming();
      this.logger.success(`✅ Claimed farming rewards successfully!`);
    }
  }
}
