import BaseFarmer from "../lib/BaseFarmer.js";

export default class MuccaFarmer extends BaseFarmer {
  static id = "mucca";
  static title = "Mucca";
  static emoji = "🐮";
  static host = "mucca.app";
  static domains = [
    "mucca.app",
    "verifyuserhttp-igzqj35s7q-oa.a.run.app",
    "europe-west6-telegram-apps-0.cloudfunctions.net",
  ];
  static telegramLink = "https://t.me/MuccaAppBot/Mucca?startapp=1147265290";
  static cacheAuth = false;
  static interval = "0 * * * *";

  /** Extracted Firebase Project ID */
  static firebaseProjectId = "telegram-apps-0";
  static firebaseProjectKey = "AIzaSyDJNC4-sJk7o2kxs-fVfMZoSGi-kkhNe7M";
  static firebaseConfig = {
    apiKey: "AIzaSyDJNC4-sJk7o2kxs-fVfMZoSGi-kkhNe7M",
    authDomain: "telegram-apps-0.firebaseapp.com",
    projectId: "telegram-apps-0",
    storageBucket: "telegram-apps-0.firebasestorage.app",
    messagingSenderId: "727265791752",
    appId: "1:727265791752:web:e369c41211df24c162e6bd",
    measurementId: "G-JY69NNZTRY",
  };

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/MuccaAppBot/Mucca?startapp=${this.getUserId()}`;
  }

  /** Get Auth */
  async fetchAuth(signal = this.signal) {
    const { token } = await this.getUser();

    return this.api
      .post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${this.constructor.firebaseProjectKey}`,
        { returnSecureToken: true, token },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.idToken}`,
    };
  }

  /** Get Secure Token */
  getSecureToken(token, signal = this.signal) {
    return this.api
      .post(
        `https://securetoken.googleapis.com/v1/token?key=${this.constructor.firebaseProjectKey}`,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: token,
        }),
        { signal }
      )
      .then((res) => res.data);
  }

  async queryFirestore(options = {}, signal = this.signal) {
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${this.constructor.firebaseProjectId}/databases/(default)/documents`;

    try {
      if (options.documentPath) {
        const res = await this.api.get(`${baseUrl}/${options.documentPath}`, {
          signal,
        });
        return res.data;
      } else {
        const res = await this.api.post(
          `${baseUrl}:runQuery`,
          {
            structuredQuery: {
              from: [{ collectionId: options.collection }],
              where: options.where,
              orderBy: options.orderBy,
              limit: options.limit,
            },
          },
          { signal }
        );

        return res.data
          .filter((entry) => entry.document)
          .map((entry) => ({
            name: entry.document.name,
            fields: entry.document.fields,
          }));
      }
    } catch (err) {
      console.error(
        "Firestore query error:",
        err.response?.data || err.message
      );
      throw err;
    }
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .post(
        "https://verifyuserhttp-igzqj35s7q-oa.a.run.app/",
        {
          initData: this.getInitData(),
          startParam: this.getStartParam(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Start Mining */
  startMining(signal = this.signal) {
    return this.api
      .post(
        "https://europe-west6-telegram-apps-0.cloudfunctions.net/startMining",
        { data: null },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Participate in Lottery */
  participateInLottery(number, signal = this.signal) {
    return this.api
      .post(
        "https://europe-west6-telegram-apps-0.cloudfunctions.net/participateInLottery",
        { data: { number, uid: this.getUserId().toString() } },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Claim Free Spin */
  claimFreeSpin(signal = this.signal) {
    return this.api
      .post(
        "https://europe-west6-telegram-apps-0.cloudfunctions.net/claimFreeSpin",
        {
          data: {
            initData: this.getInitData(),
          },
        },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Start Wheel Spin */
  startWheelSpin(signal = this.signal) {
    return this.api
      .post(
        "https://europe-west6-telegram-apps-0.cloudfunctions.net/startWheelSpin",
        {
          data: {
            initData: this.getInitData(),
          },
        },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const { user } = await this.getUser();

    this.logUserInfo(user);
    await this.executeTask("Mine", () => this.mine(user));
    await this.executeTask("Lottery", () => this.lottery(user));
    await this.executeTask("Spin", () => this.spin(user));
  }

  async getAppData() {
    const tickerData = await this.queryFirestore({
      documentPath: "utils/tickerData",
    });

    const muu = await this.queryFirestore({
      documentPath: "utils/muu",
    });

    const presaleUtils = await this.queryFirestore({
      documentPath: "presale/utils",
    });

    const coinPools = await this.queryFirestore({
      documentPath: "pools/coinPools",
    });

    return { tickerData, muu, presaleUtils, coinPools };
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user.balance);
  }

  async mine(user) {
    const miningSessions = await this.queryFirestore({
      collection: "miningSessions",
      orderBy: [
        { field: { fieldPath: "createdAt" }, direction: "DESCENDING" },
        { field: { fieldPath: "__name__" }, direction: "DESCENDING" },
      ],
      limit: 1,
    });

    const latestSession = miningSessions[0];

    if (latestSession) {
      const isSubscribed =
        latestSession.fields.subscribers.mapValue.fields[
          this.getUserId().toString()
        ];

      if (!isSubscribed) {
        await this.startMining();
        this.logger.info("Started mining");
      } else {
        this.logger.info("Already mining");
      }
    }
  }

  async lottery(user) {
    const lotterySessions = await this.queryFirestore({
      collection: "lotterySessions",
      orderBy: [
        { field: { fieldPath: "sessionNr" }, direction: "DESCENDING" },
        { field: { fieldPath: "__name__" }, direction: "DESCENDING" },
      ],
      limit: 1,
    });
    const latestSession = lotterySessions[0];

    if (latestSession) {
      const isSubscribed =
        latestSession.fields.subscribers.mapValue.fields[
          this.getUserId().toString()
        ];

      if (!isSubscribed) {
        await this.participateInLottery(Math.floor(Math.random() * 6) + 1);
        this.logger.info("Participated in lottery");
      } else {
        this.logger.info("Already participating in lottery");
      }
    }
  }

  /** Spin the Wheel */
  async spin(user) {
    const lastSpinTime = user.wheel.lastSpinClaim
      ? user.wheel.lastSpinClaim["_seconds"] * 1000
      : 0;

    const canClaimFreeSpin =
      lastSpinTime === 0 || Date.now() - lastSpinTime > 432e5;

    if (canClaimFreeSpin) {
      await this.claimFreeSpin();
      this.logger.info("Claimed free spin");
    } else if (user.wheel.spins > 0) {
      await this.startWheelSpin();
      this.logger.info("Spun the wheel");
    } else {
      this.logger.info("No spins available");
    }
  }
}
