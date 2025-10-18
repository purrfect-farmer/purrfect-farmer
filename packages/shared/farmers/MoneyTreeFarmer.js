import BaseFarmer from "../lib/BaseFarmer.js";
import { io } from "socket.io-client";

export default class MoneyTreeFarmer extends BaseFarmer {
  static id = "money-tree";
  static title = "Money Tree";
  static emoji = "🌳";
  static host = "front-mtree.extensi.one";
  static domains = ["front-mtree.extensi.one", "moneytree.extensi.one"];
  static telegramLink = "https://t.me/moneytree_game_bot?start=ref_1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/moneytree_game_bot?start=ref_${this.getUserId()}`;
  }

  /** Get Auth */
  async fetchAuth() {
    this._authData = await this.api
      .post("https://moneytree.extensi.one/api/auth/login", {
        tgId: this.getUserId(),
        isPremium: this.getIsPremiumUser(),
        userName: this.getUsername() || "",
        profileImageUrl: this.getProfilePhotoUrl() || "",
        initData: this.getInitData(),
      })
      .then((res) => res.data);

    this._player = this._authData.player;

    return this._authData;
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.accessToken}`,
    };
  }

  /** Get Auto Bot */
  getAutoBot(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/auto-bot", { signal })
      .then((res) => res.data);
  }

  /** Get Auto Bot Player */
  getAutoBotPlayer(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/auto-bot/player", { signal })
      .then((res) => res.data);
  }

  /** Get Free Boosts */
  getFreeBoosts(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/free-boosts", { signal })
      .then((res) => res.data);
  }

  /** Get Boosts */
  getBoosts(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/boosts", { signal })
      .then((res) => res.data);
  }

  /** Buy Boost */
  buyBoost(boostId, levelId, signal = this.signal) {
    return this.api
      .post(
        `https://moneytree.extensi.one/api/boosts/${boostId}/buy/${levelId}`,
        {},
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Seasons */
  getSeasons(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/seasons", { signal })
      .then((res) => res.data);
  }

  /** Get Shop Items */
  getShopItems(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/shop-item", { signal })
      .then((res) => res.data);
  }

  /** Get Offers */
  getOffers(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/offers", { signal })
      .then((res) => res.data);
  }

  /** Get Daily Bonuses */
  getDailyBonuses(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/daily-bonuses?take=30", {
        signal,
      })
      .then((res) => res.data);
  }

  /** Get Referrals */
  getReferrals(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/referrals", { signal })
      .then((res) => res.data);
  }

  /** Get Top Players */
  getTopPlayers(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/player/top", { signal })
      .then((res) => res.data);
  }

  /** Get Wallet */
  getWallet(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/wallet", { signal })
      .then((res) => res.data);
  }

  /** Get Ticket Shop */
  getTicketShop(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/ticket-shop", { signal })
      .then((res) => res.data);
  }

  /** Get Filters */
  getFilters(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/offers/filters", { signal })
      .then((res) => res.data);
  }

  /** Get Video Permission */
  getVideoPermission(signal = this.signal) {
    return this.api
      .get(
        `https://europe-west1-eone-partner.cloudfunctions.net/moneytree_tasks/get_video_permission?type=video&user_id=${this.getUserId()}`,
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get AdsGram Permission */
  getAdsGramPermission(signal = this.signal) {
    return this.api
      .get(
        `https://europe-west1-eone-partner.cloudfunctions.net/moneytree_tasks/get_adsgram_permission?type=task&user_id=${this.getUserId()}`,
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Wheel Tickets */
  getWheelTickets(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/wheel?tickets=1", { signal })
      .then((res) => res.data);
  }

  /** Buy Wheel Ticket */
  buyWheelTicket(ticketId, signal = this.signal) {
    return this.api
      .post(
        `https://moneytree.extensi.one/api/ticket-shop/${ticketId}`,
        {},
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Offers */
  getOffers(signal = this.signal) {
    return this.api
      .get("https://moneytree.extensi.one/api/offers", { signal })
      .then((res) => res.data);
  }

  /** Verify Username */
  verifyUsername(signal = this.signal) {
    return this.api
      .post(
        "https://europe-west1-eone-partner.cloudfunctions.net/moneytree_tasks/verify/moneytree_username",
        {
          ["user_id"]: this.getUserId().toString(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Collect Daily Bonus */
  collectDailyBonus(signal = this.signal) {
    return this.api
      .post(
        "https://moneytree.extensi.one/api/daily-bonuses/collect-bonus",
        {},
        { signal }
      )
      .then((res) => res.data);
  }

  /** Spin Wheel */
  spinWheel(tickets = 1, signal = this.signal) {
    return this.api
      .post("https://moneytree.extensi.one/api/wheel", { tickets }, { signal })
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const { player: user } = this._authData;

    this.logUserInfo(user);
    await this.executeTask("Check First Name", () => this.checkUserFirstName());
    await this.executeTask("Daily Bonus", () => this.claimDailyBonus());
    await this.executeTask("Claim Tickets", () => this.claimTickets());
    await this.executeTask("Play Game", () => this.playGame());
    await this.executeTask("Upgrade Boosts", () => this.upgradeBoosts());
  }
  /** Log User Info */
  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user.balance);
    this.logger.keyValue("Energy", user.energy);
    this.logger.keyValue("Damage", user.damage);
  }

  /** Upgrade Boosts */
  async upgradeBoosts() {
    let boosts = await this.getBoosts();
    let availableBoosts = boosts.map(({ boost, currentLevel }) => {
      const nextLevel = boost.levels.find(
        (level) => level.level === currentLevel + 1
      );
      return {
        ...boost,
        currentLevel,
        nextLevel,
      };
    });

    while (true) {
      const balance = this._player.balance;
      const availableUpgrades = availableBoosts.filter((boost) => {
        return boost.nextLevel && boost.nextLevel.price <= balance;
      });
      const upgrade = this.utils.randomItem(availableUpgrades);

      if (!upgrade) {
        this.logger.info("No more affordable boosts to upgrade.");
        break;
      } else {
        await this.buyBoost(upgrade.id, upgrade.nextLevel.id);
        this.logger.success(
          `⏫ ${upgrade.type} to LVL ${upgrade.nextLevel.level}`
        );

        this._player.balance -= upgrade.nextLevel.price;
        availableBoosts = availableBoosts.map((boost) => {
          if (boost.id === upgrade.id) {
            const nextLevel = boost.levels.find(
              (level) => level.level === boost.nextLevel.level + 1
            );
            return {
              ...boost,
              currentLevel: boost.nextLevel.level,
              nextLevel,
            };
          }
          return boost;
        });

        await this.utils.delayForSeconds(2, { signal: this.signal });
      }
    }
  }

  /** Play Game */
  async playGame() {
    return new Promise((resolve, reject) => {
      if (this.signal.aborted) {
        return reject(new Error("Signal already aborted"));
      }

      /** Create Socket */
      this.socket = io("wss://moneytree.extensi.one/game", {
        auth: {
          token: this._authData.accessToken,
        },
        agent: this.httpsAgent,
        withCredentials: true,
        transports: ["websocket"],
      });

      /* Handle Abort */
      this.signal.addEventListener("abort", () => {
        this.socket.close();
      });

      /* On Connect */
      this.socket.on("connect", async () => {
        this.logger.info("Socket Connected");
        while (this._player.energy >= 10) {
          if (this.signal.aborted) {
            this.socket.close();
            return reject(new Error("Signal aborted during game play"));
          }

          /* Play Game */
          this.socket.emit("leafClick");
          this._player.energy -= 10;

          /* Log Energy */
          this.logger.info(`🎮 Game - Energy: [${this._player.energy}]`);

          /* Wait 500ms */
          await this.utils.delay(500, { signal: this.signal });
        }

        this.socket.close();
        resolve();
      });

      /* Handle Errors */
      this.socket.on("connect_error", (err) => {
        this.logger.error("Socket Connection Error", err);
        reject(err);
      });

      /* On Error */
      this.socket.on("error", (err) => {
        this.logger.error("Socket Error", err);
        reject(err);
      });
    });
  }

  /** Watch Ad */
  async watchAd() {
    await this.getVideoPermission();
    await this.utils.delayForSeconds(10);
  }

  /** Claim Daily Bonus */
  async claimDailyBonus() {
    const { dailyBonuses } = await this.getDailyBonuses();
    const todayBonus = dailyBonuses.find(
      (bonus) => bonus.isAvailable && !bonus.isCollected
    );
    if (todayBonus) {
      await this.collectDailyBonus();
      this.logger.info("Collected Daily Bonus");
    }
  }

  /** Claim Wheel Tickets */
  async claimTickets() {
    for (let i = 0; i < this._player.tickets; i++) {
      await this.spinWheel(1);
      this._player.tickets -= 1;
      this.logger.info("🎟️ Spun Wheel with 1 Ticket");
      await this.utils.delayForSeconds(2, { signal: this.signal });
    }
  }

  /** Check User First Name */
  async checkUserFirstName() {
    const firstName = this.getUserFirstName();
    const word = "@moneytree_game_bot";

    if (!firstName.includes(word)) {
      await this.tryToUpdateProfile({ firstName: `${firstName} ${word}` });
      this.logger.info(`Updated first name to include ${word}`);
    }

    /** Verify Username */
    await this.verifyUsername();
  }
}
