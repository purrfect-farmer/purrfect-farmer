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
  static rating = 4;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/moneytree_game_bot?start=ref_${this.getUserId()}`;
  }

  /** Get Auth */
  async fetchAuth() {
    this.authData = await this.api
      .post("https://moneytree.extensi.one/api/auth/login", {
        tgId: this.getUserId(),
        isPremium: this.getIsPremiumUser(),
        userName: this.getUsername() || `Anonymous_${this.getUserId()}`,
        profileImageUrl: this.getProfilePhotoUrl() || "",
        initData: this.getInitData(),
      })
      .then((res) => res.data);

    this.player = this.authData.player;

    return this.authData;
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
        { signal },
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
        { signal },
      )
      .then((res) => res.data);
  }

  /** Get AdsGram Permission */
  getAdsGramPermission(signal = this.signal) {
    return this.api
      .get(
        `https://europe-west1-eone-partner.cloudfunctions.net/moneytree_tasks/get_adsgram_permission?type=task&user_id=${this.getUserId()}`,
        { signal },
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
        { signal },
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
        { signal },
      )
      .then((res) => res.data);
  }

  /** Collect Daily Bonus */
  collectDailyBonus(signal = this.signal) {
    return this.api
      .post(
        "https://moneytree.extensi.one/api/daily-bonuses/collect-bonus",
        {},
        { signal },
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
        { signal },
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
        { signal },
      )
      .then((res) => res.data);
  }

  /** Use Free Boost */
  useFreeBoost(boostId, signal = this.signal) {
    return this.api
      .post(
        `https://moneytree.extensi.one/api/free-boosts/${boostId}/use`,
        {},
        { signal },
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const { player: user } = this.authData;

    this.logUserInfo(user);
    await this.executeTask("Check First Name", () => this.checkUserFirstName());
    await this.executeTask("Daily Bonus", () => this.claimDailyBonus());
    await this.executeTask("Claim Tickets", () => this.claimTickets());
    await this.executeTask("Claim Free Boosts", () => this.claimFreeBoosts());
    await this.executeTask("Upgrade Boosts", () => this.upgradeBoosts());
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
        (level) => level.level === bot.currentLevel + 1,
      );
      return {
        ...bot,
        nextLevel,
      };
    });

    /** Upgrade Bot */
    while (true) {
      const balance = this.player.balance;
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

        this.player.balance -= upgrade.nextLevel.price;
        availableBots = availableBots.map((bot) => {
          if (bot.id === upgrade.id) {
            const nextLevel = bot.levels.find(
              (level) => level.level === bot.nextLevel.level + 1,
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
          new Date(playerAutoBot.lastShutdownTime),
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
    let availableBoosts = boosts
      .map(({ boost, currentLevel }) => {
        let maxLevel = Math.max(...boost.levels.map((level) => level.level));

        switch (boost.type) {
          case "ENERGY":
            maxLevel = 3;
            break;
          case "DAMAGE":
            maxLevel = 2;
            break;
        }

        const isMaxLevel = currentLevel >= maxLevel;

        const nextLevel = boost.levels.find(
          (level) => level.level === currentLevel + 1,
        );

        return {
          ...boost,
          currentLevel,
          isMaxLevel,
          nextLevel,
        };
      })
      .filter((boost) => !boost.isMaxLevel);

    while (true) {
      const balance = this.player.balance;
      const availableUpgrades = availableBoosts.filter((boost) => {
        return (
          !boost.isMaxLevel &&
          boost.nextLevel &&
          boost.nextLevel.price <= balance
        );
      });
      const upgrade = this.utils.randomItem(availableUpgrades);

      if (!upgrade) {
        this.logger.info("No more affordable boosts to upgrade.");
        break;
      } else {
        await this.buyBoost(upgrade.id, upgrade.nextLevel.id);
        this.logger.success(
          `⏫ ${upgrade.type} to LVL ${upgrade.nextLevel.level}`,
        );

        this.player.balance -= upgrade.nextLevel.price;
        availableBoosts = availableBoosts.map((boost) => {
          if (boost.id === upgrade.id) {
            const currentLevel = boost.nextLevel.level;
            const isMaxLevel = currentLevel >= boost.maxLevel;
            const nextLevel = boost.levels.find(
              (level) => level.level === boost.nextLevel.level + 1,
            );
            return {
              ...boost,
              currentLevel,
              isMaxLevel,
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
    let attempts = 0;
    while (attempts < 10) {
      if (this.signal.aborted) return;
      try {
        await this.tapGame();
        break;
      } catch (e) {
        this.debugger.error("Error while playing game:", e);
      } finally {
        attempts++;
      }
    }
  }

  async tapGame() {
    return new Promise((resolve, reject) => {
      if (this.signal.aborted) {
        return reject(new Error("Signal already aborted"));
      }

      /** Destroy game */
      const destroyGame = (message = "Error") => {
        reject(new Error(message));
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }
      };

      /** Reset Cancel Timeout */
      const resetCancelTimeout = () => {
        clearCancelTimeout();
        this.gameSocketTimeout = setTimeout(destroyGame, 5000, "Timeout");
      };

      /** Clear Cancel Timeout */
      const clearCancelTimeout = () => {
        if (this.gameSocketTimeout) {
          clearTimeout(this.gameSocketTimeout);
        }
      };

      /** Reset cancel timeout */
      resetCancelTimeout();

      /** Create Socket */
      this.socket = io("wss://moneytree.extensi.one/game", {
        auth: {
          token: this.authData.accessToken,
        },
        agent: this.httpsAgent,
        withCredentials: true,
        transports: ["websocket"],
      });

      /* Handle Abort */
      this.signal.addEventListener("abort", () => {
        clearCancelTimeout();
        destroyGame("Signal aborted");
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
        this.player.balance = stats.balance;
        this.player.energy = stats.energy;

        if (this.player.energy >= this.player.damage) {
          if (!this.isClickingGame) {
            /** Prevent double click */
            this.isClickingGame = true;

            /* Log Energy */
            this.logger.info(`🎮 Game - Energy: [${this.player.energy}]`);

            /** Delay */
            await this.utils.delay(200);
            /* Play Game */
            this.socket.emit("leafClick");

            /** Release */
            this.isClickingGame = false;
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
      (bonus) => bonus.isAvailable && !bonus.isCollected,
    );
    if (todayBonus) {
      await this.collectDailyBonus();
      this.logger.info("Collected Daily Bonus");
    }
  }

  /** Claim Wheel Tickets */
  async claimTickets() {
    for (let i = 0; i < this.player.tickets; i++) {
      await this.spinWheel(1);
      this.player.tickets -= 1;
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
