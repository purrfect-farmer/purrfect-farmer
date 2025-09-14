import BaseFarmer from "../lib/BaseFarmer.js";

export default class YohiFarmer extends BaseFarmer {
  static id = "yohi";
  static title = "Yohi";
  static emoji = "🪙";
  static host = "i.yohi.io";
  static domains = ["i.yohi.io"];
  static telegramLink = "https://t.me/YohiCryptoBot/yohi?startapp=7NSIr0";
  static cacheAuth = false;

  /** Get Referral Link */
  getReferralLink() {
    return this.getUser().then(
      (user) => `https://t.me/YohiCryptoBot/yohi?startapp=${user.startParam}`
    );
  }

  /** Get Auth */
  fetchAuth() {
    const data = this.getInitDataUnsafe(true);

    /** Convert authDate to ISO string */
    data["authDate"] = new Date(data["authDate"] * 1000).toISOString();

    /** Convert chatInstance to string */
    if (data["chatInstance"]) {
      data["chatInstance"] = data["chatInstance"].toString();
    }

    /** Remove signature from data */
    delete data["signature"];

    /** Prepare Payload */
    const payload = {
      ...data,
      ...data.user,
      account: "",
      tgId: this.getUserId(),
      timeStamp: Date.now(),
      userAgent: this.getDeviceId(),
    };

    /** Generate Sign */
    payload["sign"] = this.getSign({
      timeStamp: payload.timeStamp,
      tgId: payload.tgId,
    });

    return this.api
      .post("https://i.yohi.io/v1/api/user/login", payload)
      .then((res) => res.data.data);
  }

  /** Get Device ID */
  getDeviceId() {
    return (
      "dev_" +
      Math.random()
        .toString(36)
        .substring(2, 2 + 16)
    );
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.tokenValue}`,
    };
  }

  /** Get signature */
  getSignature(serializedData) {
    const hash = this.utils.md5(serializedData + "JSONBxs=JHspfJMsXxsMap");
    return hash ? hash.toLocaleUpperCase() : "";
  }

  /** Serialize Data */
  serializeData(data) {
    let serialized = "";

    for (const key in data) {
      const value = data[key];
      if (value !== null && value !== undefined && value !== "") {
        serialized += `${key}=${value}&`;
      }
    }

    return serialized;
  }

  /** Sort Data */
  sortData(data) {
    if (!data || Object.keys(data).length === 0) {
      return {};
    }

    const sortedKeys = Object.keys(data).sort();
    const sortedData = {};

    for (const key of sortedKeys) {
      sortedData[key] = data[key];
    }

    return sortedData;
  }

  /** Get Sign */
  getSign(data) {
    const sortedData = this.sortData(data);
    const serializedData = this.serializeData(sortedData);
    const signature = this.getSignature(serializedData);

    return this.utils.md5(`${signature}${data.timeStamp}`);
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .get("https://i.yohi.io/v1/api/user/getUserInfo", {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Wallet List */
  getWalletList(signal = this.signal) {
    return this.api
      .get("https://i.yohi.io/v1/api/userWallet/getWalletList", {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Farming Info */
  getFarmingInfo(signal = this.signal) {
    return this.api
      .get("https://i.yohi.io/v1/api/userFarming/getFarming", {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Start Farming */
  startFarming(signal = this.signal) {
    return this.api
      .post("https://i.yohi.io/v1/api/userFarming/startFarming", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Take Farming */
  takeFarming(signal = this.signal) {
    return this.api
      .post("https://i.yohi.io/v1/api/userFarming/takeFarming", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Sign In */
  signIn(signal = this.signal) {
    return this.api
      .post("https://i.yohi.io/v1/api/user/signIn", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Deduct Pop Number */
  deductPopNum(signal = this.signal) {
    return this.api
      .post("https://i.yohi.io/v1/api/userWallet/deductPopNum", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Pop Closing */
  popClosing(signal = this.signal) {
    const payload = {
      timeStamp: Date.now(),
      token: this.getRandomToken(),
      usdt: this.getRandomUsdt(),
    };

    payload["sign"] = this.getSign(payload);

    return this.api
      .post("https://i.yohi.io/v1/api/userWallet/popClosing", payload, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Random USDT between 0.001 and 0.009 */
  getRandomUsdt() {
    return (Math.floor(Math.random() * 900) + 100) / 100000;
  }

  /** Get Random Token */
  getRandomToken() {
    return Math.floor(Math.random() * 100) + 60;
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUser();
    const walletList = await this.getWalletList();

    this.logUserInfo(user, walletList);
    await this.executeTask("Check In", () => this.checkIn(user));
    await this.executeTask("Farming", () => this.startOrClaimFarming());
    await this.executeTask("Play Game", () => this.playGame(user));
  }

  /** Log User Info */
  logUserInfo(user, walletList) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Game", user.popGameNum);
    for (const wallet of walletList) {
      this.logger.keyValue(wallet.title, wallet.balance);
    }
  }

  /** Check In */
  async checkIn(user) {
    if (!user.signState) {
      await this.signIn();
      this.logger.info("Checked in");
    } else {
      this.logger.info("Already checked in");
    }
  }

  /** Play Game */
  async playGame(user, signal = this.signal) {
    if (user.popGameNum < 1) {
      this.logger.info("No game attempts left");
      return;
    }

    for (let i = 0; i < user.popGameNum; i++) {
      await this.deductPopNum();
      this.logger.info("Playing pop game...");
      await this.utils.delayForSeconds(30, {
        precised: true,
        signal,
      });
      await this.popClosing();
    }
  }

  /** Start or Claim Farming */
  async startOrClaimFarming() {
    const farmingInfo = await this.getFarmingInfo();
    if (farmingInfo.state === 0) {
      /** Start Farming */
      await this.startFarming();
      this.logger.info("Farming started");
    } else if (farmingInfo.state === 2) {
      /** Take Farming */
      await this.takeFarming();
      this.logger.info(`Farming claimed`);

      /** Start Farming Again */
      await this.startFarming();
      this.logger.info("Farming started");
    } else {
      this.logger.info("Farming in progress");
    }
  }
}
