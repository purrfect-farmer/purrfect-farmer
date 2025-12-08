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
  static cacheTelegramWebApp = false;
  static interval = "0 * * * *";
  static rating = 5;

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

    const auth = await this.signIn(token);
    return this.getSecureToken(auth.refreshToken);
  }

  /** Sign In with Custom Token */
  signIn(token, signal = this.signal) {
    return this.api
      .post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${this.constructor.firebaseProjectKey}`,
        { returnSecureToken: true, token },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Account Lookup */
  accountLookup(idToken, signal = this.signal) {
    return this.api
      .post(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${this.constructor.firebaseProjectKey}`,
        { idToken },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data["access_token"]}`,
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
              select: options.select
                ? { fields: options.select.map((fieldPath) => ({ fieldPath })) }
                : undefined,
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

  /** Purchase Land Slot */
  purchaseLandSlot(x, y, signal = this.signal) {
    return this.api
      .post(
        "https://europe-west6-telegram-apps-0.cloudfunctions.net/purchaseLandSlot",
        {
          data: {
            x,
            y,
            username: this.getUsername(),
            first_name: this.getUserFirstName(),
          },
        },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Claim Mining 30x Reward */
  claimMining30xReward(signal = this.signal) {
    return this.api
      .post(
        "https://europe-west6-telegram-apps-0.cloudfunctions.net/claimMining30xReward",
        {
          data: null,
        },
        { signal }
      )
      .then((res) => res.data);
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

  async getLandChunks() {
    const result = await this.queryFirestore({
      collection: "landChunks",
      select: ["owners"],
    });

    const owners = result.reduce((data, doc) => {
      const ownersFromDoc = Object.entries(
        doc.fields.owners.mapValue.fields
      ).map(([key, value]) => ({
        x: Number(key.split("-")[0]),
        y: Number(key.split("-")[1]),
        owner: value.stringValue || value.integerValue,
      }));

      return data.concat(ownersFromDoc);
    }, []);

    /* Sort by x coordinate, then by y coordinate */
    owners.sort((a, b) => {
      if (a.x !== b.x) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    const availableSlots = [];

    /* Find available slots in a 200x200 grid */
    for (let x = 0; x < 200; x++) {
      for (let y = 0; y < 200; y++) {
        const isOwned = owners.find((owner) => owner.x === x && owner.y === y);

        if (!isOwned) {
          availableSlots.push({ x, y });
        }
      }
    }

    return { owners, availableSlots };
  }

  /** Process Farmer */
  async process() {
    const { user } = await this.getUser();

    this.logUserInfo(user);
    await this.executeTask("Mine", () => this.mine(user));
    await this.executeTask("Lottery", () => this.lottery(user));
    await this.executeTask("Spin", () => this.spin(user));
    await this.executeTask("Buy Land Slot", () => this.buyLandSlot(user));
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user.balance);
  }

  async buyLandSlot(user) {
    const LAND_SLOT_PRICE = 50;
    let balance = user.balance || 0;
    if (balance >= LAND_SLOT_PRICE) {
      let { availableSlots } = await this.getLandChunks();
      while (true) {
        if (this.signal.aborted) {
          this.logger.warn("Aborting land slot purchases due to signal abort.");
          break;
        }

        if (availableSlots.length === 0) {
          break;
        }
        if (balance < LAND_SLOT_PRICE) {
          break;
        }

        /**
         * Purchase only every 4th hour to avoid rapid purchases
         *
         * Yes this is a loop but its intended to avoid flagging by purchasing
         * multiple slots in a single run
         *
         * Remove this condition to purchase as many as possible in one run
         */
        if (new Date().getHours() % 4 !== 0) {
          this.logger.info(
            "Skipping land slot purchases outside of every 4th hour."
          );
          break;
        }

        const slotToBuy = this.utils.randomItem(availableSlots);
        await this.purchaseLandSlot(slotToBuy.x, slotToBuy.y);
        /* Deduct price from balance */
        balance -= LAND_SLOT_PRICE;

        this.logger.success(
          `🏝️ Purchased (${slotToBuy.x}, ${slotToBuy.y}) BAL: ${balance.toFixed(
            2
          )}`
        );

        /* Remove purchased slot from available slots */
        availableSlots = availableSlots.filter(
          (slot) => slot.x !== slotToBuy.x || slot.y !== slotToBuy.y
        );

        /* Small delay to avoid rapid purchases */
        await this.utils.delayForSeconds(1, { signal: this.signal });
      }
    } else {
      this.logger.info(
        `Insufficient balance to purchase land slot. Current balance: ${balance}`
      );
    }
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
