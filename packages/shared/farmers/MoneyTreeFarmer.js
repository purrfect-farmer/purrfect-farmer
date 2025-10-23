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
  static interval = "*/3 * * * *";

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

  /** Purchase Auto Bot */
  purchaseAutoBot(itemId, levelId, signal = this.signal) {
    return this.api
      .post(
        `https://moneytree.extensi.one/api/auto-bot/${itemId}/buy/${levelId}`,
        {},
        { signal }
      )
      .then((res) => res.data);
  }

  /** Use Auto Bot */
  useAutoBot(signal = this.signal) {
    return this.api
      .post("https://moneytree.extensi.one/api/auto-bot/use", {}, { signal })
      .then((res) => res.data);
  }

  /** Collect Auto Bot */
  collectAutoBot(signal = this.signal) {
    return this.api
      .post(
        "https://moneytree.extensi.one/api/auto-bot/collect",
        {},
        { signal }
      )
      .then((res) => res.data);
  }

  /** Use Free Boost */
  useFreeBoost(boostId, signal = this.signal) {
    return this.api
      .post(
        `https://moneytree.extensi.one/api/free-boosts/${boostId}/use`,
        {},
        { signal }
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const { player: user } = this._authData;

    this.logUserInfo(user);
    await this.executeTask("Check First Name", () => this.checkUserFirstName());
    await this.executeTask("Daily Bonus", () => this.claimDailyBonus());
    await this.executeTask("Claim Tickets", () => this.claimTickets());
    await this.executeTask("Claim Free Boosts", () => this.claimFreeBoosts());
    await this.executeTask("Upgrade Boosts", () => this.upgradeBoosts());
    await this.executeTask("Auto Bot", () => this.claimOrPurchaseAutoBot());
    await this.executeTask("Play Game", () => this.playGame());
  }
  /** Log User Info */
  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user.balance);
    this.logger.keyValue("Energy", user.energy);
    this.logger.keyValue("Regeneration", user.regeneration);
    this.logger.keyValue("Damage", user.damage);
  }

  /** Claim or Purchase Auto Bot */
  async claimOrPurchaseAutoBot() {
    let { autoBots } = await this.getAutoBot();
    let availableBots = autoBots.map((bot) => {
      const nextLevel = bot.levels.find(
        (level) => level.level === bot.currentLevel + 1
      );
      return {
        ...bot,
        nextLevel,
      };
    });

    /** Upgrade Bot */
    while (true) {
      const balance = this._player.balance;
      const availableUpgrades = availableBots.filter((bot) => {
        return bot.nextLevel && bot.nextLevel.price <= balance;
      });
      const upgrade = this.utils.randomItem(availableUpgrades);

      if (!upgrade) {
        this.logger.info("No more affordable bot to upgrade.");
        break;
      } else {
        await this.purchaseAutoBot(upgrade.id, upgrade.nextLevel.id);
        this.logger.success(`⏫ AUTO BOT to LVL ${upgrade.nextLevel.level}`);

        this._player.balance -= upgrade.nextLevel.price;
        availableBots = availableBots.map((bot) => {
          if (bot.id === upgrade.id) {
            const nextLevel = bot.levels.find(
              (level) => level.level === bot.nextLevel.level + 1
            );
            return {
              ...bot,
              currentLevel: bot.nextLevel.level,
              nextLevel,
            };
          }
          return bot;
        });

        await this.utils.delayForSeconds(2, { signal: this.signal });
      }
    }

    const { playerAutoBot } = await this.getAutoBotPlayer();

    if (playerAutoBot) {
      if (!playerAutoBot.isActive) {
        await this.useAutoBot();
        this.logger.success("Started Auto Bot");
      } else if (
        this.utils.dateFns.isAfter(
          new Date(),
          new Date(playerAutoBot.lastShutdownTime)
        )
      ) {
        await this.collectAutoBot();
        this.logger.success("Collected Auto Bot");
      }
    }
  }

  /** Claim Free Boosts */
  async claimFreeBoosts() {
    const freeBoosts = await this.getFreeBoosts();

    for (const boost of freeBoosts) {
      if (boost.charge > 0) {
        await this.useFreeBoost(boost.id);
        this.logger.success(`Used Free Boost: ${boost.boostType}`);
      }
    }
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

      /** Reset Cancel Timeout */
      const resetCancelTimeout = () => {
        clearCancelTimeout();
        this._socketCancelTimeout = setTimeout(() => {
          this.socket.close();
          reject(new Error("Socket Timeout"));
        }, 5000);
      };

      /** Clear Cancel Timeout */
      const clearCancelTimeout = () => {
        if (this._socketCancelTimeout) {
          clearTimeout(this._socketCancelTimeout);
        }
      };

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
        clearCancelTimeout();
        this.socket.close();
      });

      /* On Connect */
      this.socket.on("connect", async () => {
        /** Reset Cancel Timeout */
        resetCancelTimeout();

        this.logger.info("Socket Connected");
      });

      /* Handle Errors */
      this.socket.on("connect_error", (err) => {
        this.logger.error("Socket Connection Error", err);
        clearCancelTimeout();
        reject(err);
      });

      /* On Error */
      this.socket.on("error", (err) => {
        this.logger.error("Socket Error", err);
        clearCancelTimeout();
        reject(err);
      });

      /** Update Player Stats */
      this.socket.on("playerStats", async (stats) => {
        /** Reset Cancel Timeout */
        resetCancelTimeout();

        /** Update Balance */
        this._player.balance = stats.balance;
        this._player.energy = stats.energy;

        if (this._player.energy >= this._player.damage) {
          if (!this._isClicking) {
            /** Prevent double click */
            this._isClicking = true;

            /* Log Energy */
            this.logger.info(`🎮 Game - Energy: [${this._player.energy}]`);

            /** Delay */
            await this.utils.delay(200);
            /* Play Game */
            this.socket.emit("leafClick");

            /** Release */
            this._isClicking = false;
          }
        } else {
          this.socket.close();
          clearCancelTimeout();
          resolve();
        }
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
