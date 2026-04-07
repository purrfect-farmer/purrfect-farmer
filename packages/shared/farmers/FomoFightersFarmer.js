import BaseFarmer from "../lib/BaseFarmer.js";

export default class FomoFightersFarmer extends BaseFarmer {
  static id = "fomo-fighters";
  static title = "Fomo Fighters";
  static emoji = "⚔️";
  static host = "game.fomofighters.xyz";
  static domains = ["game.fomofighters.xyz", "api.fomofighters.xyz"];
  static telegramLink =
    "https://t.me/fomo_fighters_bot/game?startapp=ref1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static rating = 5;
  static published = false;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/fomo_fighters_bot/game?startapp=ref${this.getUserId()}`;
  }

  /* Configure Api */
  configureApi() {
    const requestInterceptor = this.api.interceptors.request.use((config) => {
      config.data = { data: config.data };
      config.headers = {
        ...config.headers,
        ...this.getSignedHeaders(config.data),
      };

      return config;
    });

    const responseInterceptor = this.api.interceptors.response.use(
      (response) => {
        const data = response.data?.data;

        if (data && typeof data) {
          Object.entries(data).forEach(([key, value]) => {
            if (this.allData && key in this.allData) {
              /** Update allData */
              this.allData[key] = value;
              this.debugger.log("allData", key, value);
            } else if (this.afterData && key in this.afterData) {
              /** Update afterData */
              this.afterData[key] = value;
              this.debugger.log("afterData", key, value);
            } else if (this.allData && key in this.allData.hero) {
              /** Update allData.hero */
              this.allData.hero[key] = value;
              this.debugger.log("allData.hero", key, value);
            } else {
              this.debugger.log("unknown-key", key, value);
            }
          });
        }

        return response;
      },
    );

    return () => {
      this.api.interceptors.request.eject(requestInterceptor);
      this.api.interceptors.request.eject(responseInterceptor);
    };
  }

  getSignedHeaders(data) {
    const apiTime = Math.floor(Date.now() / 1000);
    const apiHash = this.utils.md5(
      encodeURIComponent(`${apiTime}_${JSON.stringify(data || "")}`),
    );

    return {
      "Api-Key": this.getInitDataHash(),
      "Api-Time": apiTime,
      "Api-Hash": apiHash,
      "Is-Beta-Server": null,
    };
  }

  getUserAllData() {
    return this.api
      .post("https://api.fomofighters.xyz/user/data/all", {})
      .then((res) => res.data.data);
  }

  getUserAfterData() {
    return this.api
      .post("https://api.fomofighters.xyz/user/data/after", { lang: "en" })
      .then((res) => res.data.data);
  }

  getUserTimers() {
    return this.api
      .post("https://api.fomofighters.xyz/user/data/timers", { lang: "en" })
      .then((res) => res.data.data);
  }

  checkQuest(key, value) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/check", [key, value])
      .then((res) => res.data.data);
  }

  claimQuest(key, value = null) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/claim", [key, value])
      .then((res) => res.data.data);
  }

  claimDailyQuest(day) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/daily/claim", day)
      .then((res) => res.data.data);
  }

  claimMainQuest(questKey) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/main/claim", { questKey })
      .then((res) => res.data.data);
  }

  claimSideQuest(name) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/side/claim", name)
      .then((res) => res.data.data);
  }

  /**
   * Claim resource
   * @param {"food" | "wood" | "stone" | "gem"} type
   */
  claimResource(type) {
    return this.api
      .post("https://api.fomofighters.xyz/resource/claim", type)
      .then((res) => res.data.data);
  }

  /**
   * Finish onboarding
   * @param {string | number} level
   * @returns {Promise<Record<"onboarding", string[]>>}
   */
  finishOnboarding(level) {
    return this.api
      .post("https://api.fomofighters.xyz/onboarding/finish", Number(level))
      .then((res) => res.data.data);
  }

  /**
   * Get attack info
   * @returns {Promise<Record<"hero"|"troops"|"tAttacks"|"tScouts"|"tReturns"|"tScoutReturns"|"log"|"targets"|"hospital"|"leads", object | object[]>>}
   */
  getAttackInfo() {
    return this.api
      .post("https://api.fomofighters.xyz/attack/info", {})
      .then((res) => res.data.data);
  }

  /**
   * Get target info
   * @param {string} target
   * @returns {Promise<Record<"target", object>>}
   */
  getTargetInfo(target) {
    return this.api
      .post("https://api.fomofighters.xyz/target/info", target)
      .then((res) => res.data.data);
  }

  getBattleLogs() {
    return this.api
      .post("https://api.fomofighters.xyz/battle/logs/my", {})
      .then((res) => res.data.data);
  }

  getTargetLogs(target) {
    return this.api
      .post("https://api.fomofighters.xyz/target/logs", target)
      .then((res) => res.data.data);
  }

  readTargetLog(id) {
    return this.api
      .post("https://api.fomofighters.xyz/battle/logs/read", id)
      .then((res) => res.data.data);
  }

  readAllBattleLogs() {
    return this.api
      .post("https://api.fomofighters.xyz/battle/logs/read/all")
      .then((res) => res.data.data);
  }

  getBuildingInfo() {
    return this.api
      .post("https://api.fomofighters.xyz/building/info", {})
      .then((res) => res.data.data);
  }

  getTroopsInfo() {
    return this.api
      .post("https://api.fomofighters.xyz/troops/info", {})
      .then((res) => res.data.data);
  }

  speedupBuildingTimer(timerId, speedUpKey) {
    return this.api
      .post("https://api.fomofighters.xyz/building/timer/speedup", {
        timerId,
        speedUpKey,
      })
      .then((res) => res.data.data);
  }

  speedupTroopsTimer(timerId, speedUpKey) {
    return this.api
      .post("https://api.fomofighters.xyz/troops/timer/speedup", {
        timerId,
        speedUpKey,
      })
      .then((res) => res.data.data);
  }

  /**
   * Purchase building instantly with gems
   * @param {number} position
   * @param {string} buildingKey
   * @param {number} expectedPrice
   */
  purchaseBuildingInstant(position, buildingKey, expectedPrice) {
    return this.api
      .post("https://api.fomofighters.xyz/building/buy/instant", {
        position,
        buildingKey,
        expectedPrice,
      })
      .then((res) => res.data.data);
  }

  /**
   * Claim story daily quest
   * @param {string} questKey
   */
  claimStoryDailyQuest(questKey) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/story/daily/claim", [questKey])
      .then((res) => res.data.data);
  }

  getAttackRating() {
    return this.api
      .post("https://api.fomofighters.xyz/attack/rating", {})
      .then((res) => res.data.data);
  }

  getClanRating(page = 1) {
    return this.api
      .post("https://api.fomofighters.xyz/clan/rating", page)
      .then((res) => res.data.data);
  }

  getClanMembers(clanId) {
    return this.api
      .post("https://api.fomofighters.xyz/clan/members", clanId)
      .then((res) => res.data.data);
  }

  claimClanReward(rewardKey) {
    return this.api
      .post("https://api.fomofighters.xyz/clan/reward/claim", rewardKey)
      .then((res) => res.data.data);
  }

  getWalletInfo() {
    return this.api
      .post("https://api.fomofighters.xyz/ton/wallet/info", {})
      .then((res) => res.data.data);
  }

  getPurchaseList() {
    return this.api
      .post("https://api.fomofighters.xyz/purchase/list", {})
      .then((res) => res.data.data);
  }

  purchaseLand(position, buildingKey) {
    return this.api
      .post("https://api.fomofighters.xyz/building/buy", {
        position,
        buildingKey,
      })
      .then((res) => res.data.data);
  }

  purchaseTroops(troopKey, count) {
    return this.api
      .post("https://api.fomofighters.xyz/troops/buy", {
        troopKey,
        count,
      })
      .then((res) => res.data.data);
  }

  createAttack(target, troops) {
    return this.api
      .post("https://api.fomofighters.xyz/attack/create", {
        target,
        troops,
      })
      .then((res) => res.data.data);
  }

  createScout(target, troops) {
    return this.api
      .post("https://api.fomofighters.xyz/attack/create/scout", {
        target,
        troops,
      })
      .then((res) => res.data.data);
  }

  /**
   * Select the race
   * @param {"dog" | "frog" | "cat"} race
   */
  selectRace(race) {
    return this.api
      .post("https://api.fomofighters.xyz/race/select", race)
      .then((res) => res.data.data);
  }

  /** Get Auth */
  async login() {
    return this.api
      .post("https://api.fomofighters.xyz/telegram/auth", {
        initData: this.getInitData(),
        photoUrl: this.getProfilePhotoUrl(),
        platform: "android",
        chatId: "",
      })
      .then((res) => res.data.data);
  }

  /** Process Farmer */
  async process() {
    await this.login();

    this.allData = await this.getUserAllData();
    this.afterData = await this.getUserAfterData();

    this.debugger.log("Fomo fighters:", {
      allData: this.allData,
      afterData: this.afterData,
    });

    /** Log user info */
    this.logUserInfo();

    await this.executeTask("Onboarding", () => this.completeOnboarding());
    await this.executeTask("Resources", () => this.claimGameResources());
    await this.executeTask("Quests", () => this.completeGameQuests());
    await this.executeTask("Daily reward", () => this.getDailyReward());

    if (this.allData.hero.level >= 2) {
      await this.executeTask("Building upgrades", () =>
        this.performBuildingUpgrades(),
      );

      await this.executeTask("Train troops", () => this.trainAvailableTroops());
      await this.executeTask("Attacks", () => this.performAttacks());
      await this.executeTask("Resources (2nd pass)", () =>
        this.claimGameResources(),
      );
      await this.executeTask("Quests (2nd pass)", () =>
        this.completeGameQuests(),
      );
    }

    await this.executeTask("Clan rewards", () => this.claimClanRewards());
    await this.executeTask("Story daily quests", () =>
      this.completeStoryDailyQuests(),
    );
  }

  logUserInfo() {
    const hero = this.getHero();
    const resources = this.getAllResources();

    this.logger.keyValue("Hero Level", hero.level);
    this.logger.keyValue("Race", hero.race || "Not selected");
    this.logger.keyValue(
      "Power",
      hero.powerBuildings + hero.powerTroops + hero.powerSkills,
    );
    this.logger.keyValue("Food", resources.food?.value || 0);
    this.logger.keyValue("Wood", resources.wood?.value || 0);
    this.logger.keyValue("Stone", resources.stone?.value || 0);
    this.logger.keyValue("Gems", resources.gem?.value || 0);
    this.logger.keyValue("Buildings", this.getOwnedBuildings().length);
    this.logger.keyValue("Clan", this.allData.clan?.length ? "Yes" : "No");
  }

  async getDailyReward() {
    const dailyReward = Object.entries(this.afterData.questDailyRewards).find(
      ([key, value]) => value === "canTake",
    );

    if (dailyReward) {
      await this.delayWithMessage(3, "Claiming daily reward");
      await this.claimDailyQuest(dailyReward[0]);
      this.logger.success("Claimed daily reward");
    }
  }

  async claimClanRewards() {
    /** Skip if not in a clan */
    if (!this.allData.clan || !this.allData.clan.length) {
      this.logger.debug("Not in a clan - skipping clan rewards");
      return;
    }

    /** Check for claimable clan rewards */
    const clanRewards = this.afterData.stClanRewards || [];
    const dbClanRewards = this.allData.dbData.dbClanRewards || [];

    for (const reward of dbClanRewards) {
      if (this.signal.aborted) return;

      /** Check if already claimed */
      const claimed = clanRewards.find((r) => r.key === reward.key);
      if (claimed) continue;

      /** Try to claim */
      try {
        await this.delayWithMessage(3, "Claiming clan reward");
        await this.claimClanReward(reward.key);
        this.logger.success(`Claimed clan reward: ${reward.key}`);
      } catch {
        this.logger.debug(`Clan reward not available: ${reward.key}`);
        break;
      }
    }
  }

  async completeStoryDailyQuests() {
    const quests = this.allData.dbData.dbQuestsStoryDaily;
    const claimed = this.getDailyStats().claimedStoryDaily || [];

    for (const quest of quests) {
      if (this.signal.aborted) return;

      /** Skip already claimed */
      if (claimed.includes(quest.key)) continue;

      let claimable = false;

      if (quest.type === "resourceClaim") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.resourceClaim?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "resourceLoot") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.resourceLoot?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "trainBuilding") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.trainBuilding?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "attack") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.attack?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "buildings") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.buildings?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "skills") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.skills?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "pvp") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.pvp?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "clan") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.clan?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "resourceBuy") {
        const dailyStats = this.getDailyStats();
        const value = dailyStats.resourceBuy?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (claimable) {
        await this.delayWithMessage(3, "Claiming daily quest");
        await this.claimStoryDailyQuest(quest.key);
        this.logger.success(`Claimed story daily quest: ${quest.key}`);
      }
    }
  }

  async completeGameQuests() {
    await this.completeMainQuest();
    await this.completeSideQuests();
    await this.completePremiumQuests();
  }

  async claimGameResources() {
    await this.claimResources();
  }

  /** Attack available targets (oases and camps) */
  async performAttacks() {
    const attackers = this.getAvailableAttackers();
    if (attackers.length === 0) {
      this.logger.debug("No troops available for attacks");
      return;
    }

    /** Attack oases first */
    const oases = this.findAvailableTargets("oasis");
    for (const target of oases) {
      if (this.signal.aborted) return;
      if (this.getAvailableAttackers().length === 0) break;

      await this.attackSingleTarget(target);
      await this.utils.delayForSeconds(2, { signal: this.signal });
    }

    /** Then attack camps */
    const camps = this.findAvailableTargets("camp");
    for (const target of camps) {
      if (this.signal.aborted) return;
      if (this.getAvailableAttackers().length === 0) break;

      await this.attackSingleTarget(target);
      await this.utils.delayForSeconds(2, { signal: this.signal });
    }
  }

  /** Attack a single target */
  async attackSingleTarget(target) {
    if (this.hasAttackTimer(target.id)) return;

    /** Scout camps first */
    if (target.type === "camp") {
      const scouted = await this.scoutTarget(target.id);
      if (!scouted) return;
    }

    const selectedTroops = this.utils.randomItem(this.getAvailableAttackers());
    if (!selectedTroops) return;

    await this.createAttack(target.id, {
      [selectedTroops.troop.key]: selectedTroops.count,
    });

    this.logger.success(
      `Attack on ${target.type}: ${target.id} with ${selectedTroops.troop.title}`,
    );

    await this.waitForFullAttack(target.id);
    await this.openLogs();
  }

  /** Train troops at all owned military buildings */
  async trainAvailableTroops() {
    const militaryBuildings = this.allData.dbData.dbBuildings.filter(
      (item) => item.type === "Military",
    );

    for (const building of militaryBuildings) {
      if (this.signal.aborted) return;

      const owned = this.findOwnedBuilding(building.key);
      if (!owned) continue;

      /** Get training capacity for this building */
      const capacityKey = this.utils.changeCase.camelCase(
        `training_capacity_${building.key}`,
      );
      const capacity = this.allData.hero.propsCompiled?.[capacityKey] || 1;

      /** Find best trainable troop for this building */
      const trainable = this.getBuildingTroops(building.key)
        .filter((item) => this.meetsTroopRequirements(item))
        .filter((item) => {
          const requiredGem = item.priceGem || 0;
          const requiredFood = item.priceFood || 0;
          const requiredWood = item.priceWood || 0;
          const requiredStone = item.priceStone || 0;

          const totalGem = capacity * requiredGem;
          const totalFood = capacity * requiredFood;
          const totalWood = capacity * requiredWood;
          const totalStone = capacity * requiredStone;

          return (
            totalGem <= this.getResourceValue("gem") &&
            totalFood <= this.getResourceValue("food") &&
            totalWood <= this.getResourceValue("wood") &&
            totalStone <= this.getResourceValue("stone")
          );
        })
        .sort((a, b) => b.tier - a.tier);

      const best = trainable[0];
      if (!best) continue;

      /** Purchase troops */
      await this.delayWithMessage(2, "Purchasing troop");
      await this.purchaseTroops(best.key, capacity);
      this.logger.success(`Trained ${capacity}x ${best.title} at ${owned.key}`);

      /** Speedup or wait */
      await this.speedupOrWaitTroops(best.key);
      await this.getTroopsInfo();
    }
  }

  /** Upgrade buildings progressively, respecting castle-level gating */
  async performBuildingUpgrades() {
    const castleLevel = this.allData.hero.level;

    /**
     * Buildings gated by progression:
     * - Castle 1: farm_1, lumber_mill_1
     * - Castle 2: archery_range, storage, castle upgrades
     * - Castle 3+: scout_camp, barracks, academy, quarry_1
     * - Requires academy research: stable, siege_workshop
     * - Higher tiers: farm_2/3, lumber_mill_2/3, quarry_2/3
     */
    const upgradePriority = [
      "castle",
      "storage",
      "farm_1",
      "lumber_mill_1",
      "archery_range",
      "scout_camp",
      "barracks",
      "quarry_1",
      "academy",
      "farm_2",
      "lumber_mill_2",
      "quarry_2",
      "hospital",
      "stash",
      "stable",
      "siege_workshop",
      "farm_3",
      "lumber_mill_3",
      "quarry_3",
      "market",
      "tavern",
    ];

    for (const key of upgradePriority) {
      if (this.signal.aborted) return;

      const building = this.findGameBuilding(key);
      if (!building) continue;

      const owned = this.findOwnedBuilding(key);
      const nextLevel = owned ? owned.level + 1 : 1;

      /** Check if this level exists */
      const levelData = building.levels?.find((l) => l.level === nextLevel);
      if (!levelData) continue;

      /** Check castle requirement (first level's requiredBuildings) */
      const requiredCastle = levelData.requiredBuildings?.castle || 0;
      if (requiredCastle > castleLevel) continue;

      /** Try to upgrade */
      const canPurchase = await this.checkBuildingRequirements(
        building,
        nextLevel,
      );
      if (!canPurchase) continue;

      await this.upgradeBuilding(key);
      await this.utils.delayForSeconds(2, { signal: this.signal });

      /** After upgrading, try to claim related quests immediately */
      await this.completeMainQuest();
      await this.utils.delayForSeconds(1, { signal: this.signal });
    }
  }

  /**
   * Delay with message
   * @param {number} length
   * @param {string} message
   */
  async delayWithMessage(length, message) {
    this.logger.debug(`${message} in ${length} seconds...`);
    await this.utils.delayForSeconds(length, { signal: this.signal });
  }

  /** Accept terms */
  async acceptTerms() {
    if (this.allData.hero.onboarding.length === 0) {
      await this.delayWithMessage(3, "Accepting terms");
      await this.finishOnboarding(1);
      this.logger.success("Accepted terms!");
    }
  }

  /** Pick random race */
  async pickRandomRace() {
    if (!this.allData.hero.race) {
      const race = this.utils.randomItem(
        this.allData.dbData.dbRaces.filter((item) => item.type === "people"),
      );
      this.logger.keyValue("Race", race.title);
      this.logger.keyValue("Description", race.desc);
      await this.delayWithMessage(10, "Selecting race");
      await this.selectRace(race.key);
      this.logger.success(`Selected race: ${race.title} - ${race.desc}`);
    }
  }

  async completeOnboarding() {
    /** Accept terms */
    await this.acceptTerms();

    /** Select race */
    await this.pickRandomRace();

    /** Complete onboarding */
    for (const onboarding of this.allData.dbData.dbOnboarding) {
      /** Signal aborted */
      if (this.signal.aborted) return;

      /** Skip completed */
      if (this.hasCompletedOnboarding(onboarding.key)) {
        continue;
      }

      /** Log onboarding */
      this.logger.debug(`Onboarding: ${onboarding.title}`);

      /** Compare hero level */
      if (
        this.allData.hero.level < onboarding.minHeroLevel ||
        this.allData.hero.level > onboarding.maxHeroLevel
      ) {
        this.logger.warn("Skipped onboarding due to hero level");
        continue;
      }

      /** Action */
      const action = onboarding.action;

      /** Check type */
      const checkType = onboarding.needToShowMethodCheck;

      /** Build something */
      if (checkType === "build") {
        const checked = await this.checkBuildings(onboarding.data);
        if (!checked) return;
      }

      /** Claim something */
      if (checkType === "claimSmt") {
        if (!this.hasClaimedAnyResource()) {
          await this.claimResources();
        }
      }

      /** Claim main story quest */
      if (checkType === "claimQuestStoryMain") {
        if (!this.hasClaimedMainQuest()) {
          const claimed = await this.completeMainQuest();
          if (!claimed) return;
        }
      }

      /** Claim quests */
      if (checkType === "claimQuests") {
        if (!this.hasClaimedMainQuest()) {
          const claimed = await this.completeMainQuest();
          if (!claimed) return;
        }
      }

      /** Train troops */
      if (checkType === "trainBuilding") {
        if (!this.hasTrainedBuilding(onboarding.data)) {
          const trained = await this.trainTroops(onboarding.data);
          if (!trained) return;
        }
      }

      /** Attack */
      if (checkType === "attack") {
        if (!this.hasAttacked(onboarding.data)) {
          const attacked = await this.attackTargets(onboarding.data);
          if (!attacked) return;
        }
      }

      /** Open logs */
      if (checkType === "openLogs") {
        await this.openLogs();
      }

      /** Claim 3+ main quests */
      if (checkType === "claimQuests3") {
        await this.completeMainQuest();
      }

      /** Claim daily reward if not claimed */
      if (checkType === "notClaimDailyReward") {
        await this.getDailyReward();
      }

      /**
       * Action-gated steps (no checkType, server auto-completes):
       * - /city/castle: Upgrade castle
       * These are completed server-side when the action succeeds.
       */
      if (!checkType && onboarding.action === "/city/castle") {
        const upgraded = await this.upgradeCastle();
        if (!upgraded) return;
      }

      /** Complete onboarding */
      if (onboarding.isCompleteAfterClick) {
        await this.delayWithMessage(2, `Completing onboarding`);
        await this.finishOnboarding(onboarding.key);
        this.logger.success(`Completed onboarding: ${onboarding.title}`);
        await this.utils.delayForSeconds(1, { signal: this.signal });
      }
    }
  }

  async claimResources() {
    for (const resource of this.allData.dbData.dbRes) {
      if (this.signal.aborted) return;

      if (this.canClaimResource(resource.key)) {
        await this.delayWithMessage(2, `Claiming: ${resource.title}`);
        await this.claimResource(resource.key);
        this.logger.success(`Claimed: ${resource.title}`);
      }
    }
  }

  /** Check if resource can be claimed */
  canClaimResource(key) {
    const perHour = this.allData.hero.propsCompiled[key + "PH"];
    if (!perHour) return false;

    const lastClaimDate = this.allData.hero.resources[key]?.lastClaimDate;
    if (!lastClaimDate) return true;

    const storageLimit =
      this.allData.hero.propsCompiled[key + "StorageLimit"] ?? Infinity;

    const diffSeconds = this.utils.dateFns.differenceInSeconds(
      new Date(),
      new Date(this.normalizeDate(lastClaimDate)),
    );

    if (diffSeconds <= 0) return false;

    const generated = Math.min(storageLimit, (diffSeconds / 3600) * perHour);
    const resource = this.allData.dbData.dbRes.find((item) => item.key === key);

    this.logger.debug(`Available ${resource.title}: ${generated}`);

    return generated > 0;
  }

  normalizeDate(dateString) {
    return `${dateString}Z`;
  }

  /** Open logs */
  async openLogs() {
    const logs = await this.getBattleLogs();
    const unread = logs.filter((item) => !item.isRead);

    if (unread.length > 0) {
      await this.delayWithMessage(3, "Reading logs");
      await this.readAllBattleLogs();
    }
  }

  async completeMainQuest() {
    /** Get db quests */
    const quests = this.allData.dbData.dbQuestsMain;

    while (true) {
      /** Find last completed main quest */
      const lastCompleted = quests.find(
        (item) => item.key === this.allData.hero.questMainCompleted,
      );

      /** Find next quest */
      const quest = lastCompleted
        ? quests.find((item) => item.order > lastCompleted.order)
        : quests[0];

      if (!quest) {
        return false;
      }

      /** Log main quest */
      this.logger.debug(
        `Last completed: ${this.allData.hero.questMainCompleted || "(NONE)"}`,
      );
      this.logger.debug(`Main quest: ${quest.key}`);

      let claimable = false;

      if (quest.type === "build") {
        const owned = this.findOwnedBuilding(quest.data);

        if (owned && owned.level >= quest.count) {
          claimable = true;
        }
      }

      if (quest.type === "trainTotal") {
        const total = Object.values(this.getStats()["train"]).reduce(
          (result, value) => result + value,
          0,
        );

        if (total >= quest.count) {
          claimable = true;
        }
      }

      if (quest.type === "attack") {
        claimable = this.hasAttacked({
          [quest.data]: quest.count,
        });
      }

      if (quest.type === "power") {
        claimable = this.getTotalPower() >= quest.count;
      }

      if (quest.type === "resourceBuy") {
        const stats = this.getStats();
        const value = stats.resourceBuy?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "clan") {
        const stats = this.getStats();
        const value = stats.clan?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (quest.type === "research") {
        const stats = this.getStats();
        const value = stats.skills?.[quest.data] || 0;
        claimable = value >= quest.count;
      }

      if (claimable) {
        await this.delayWithMessage(2, "Claiming quest");
        await this.claimMainQuest(quest.key);
        this.logger.success(`Claimed main quest: ${quest.key}`);
      } else {
        return claimable;
      }
    }
  }

  async completePremiumQuests() {
    /** Get db quests */
    const quests = this.allData.dbData.dbQuests;
    const riddle = quests.find((item) => item.key.startsWith("riddle_"));
    const others = quests.filter((item) => !item.key.startsWith("riddle_"));

    if (riddle) {
      this.logger.info(`Riddle: ${riddle.desc}`);
      this.logger.warn(`Answer: ${riddle.checkData}`);

      const riddleQuest = this.afterData.quests.find(
        (item) => item.key === riddle.key,
      );

      if (!riddleQuest) {
        await this.delayWithMessage(2, "Submitting riddle");
        await this.checkQuest(riddle.key, riddle.checkData);
        this.logger.success(`Submitted riddle: ${riddle.title}`);
      }

      if (!riddleQuest || !riddleQuest.isRewarded) {
        await this.delayWithMessage(2, "Claiming riddle");
        await this.claimQuest(riddle.key);
        this.logger.success(`Claimed riddle: ${riddle.title}`);
      }
    }
  }

  async completeSideQuests() {
    /** Get db quests */
    const quests = this.allData.dbData.dbQuestsSide;

    for (const quest of quests) {
      for (let i = 0; i < quest.counts.length; i++) {
        const completion = this.afterData.questsSideCompleted[quest.key] || 0;

        if (completion > i) continue;

        const target = quest.counts[i];

        let claimable = false;

        if (quest.type === "build") {
          const owned = this.findOwnedBuilding(quest.data);

          if (owned && owned.level >= target) {
            claimable = true;
          }
        }

        if (quest.type === "attack") {
          claimable = this.hasAttacked({
            [quest.data]: target,
          });
        }

        if (quest.type === "resourceClaim") {
          claimable = this.hasClaimedResource({
            [quest.data]: target,
          });
        }

        if (quest.type === "resourceLoot") {
          claimable = this.hasLootedResource({
            [quest.data]: target,
          });
        }

        if (quest.type === "resourceBuy") {
          const stats = this.getStats();
          const value = stats.resourceBuy?.[quest.data] || 0;
          claimable = value >= target;
        }

        if (quest.type === "trainBuilding") {
          claimable = this.hasTrainedBuilding({
            [quest.data]: target,
          });
        }

        if (quest.type === "clan") {
          const stats = this.getStats();
          const value = stats.clan?.[quest.data] || 0;
          claimable = value >= target;
        }

        if (quest.type === "killPoints") {
          const hero = this.getHero();
          claimable = hero.killPoints >= target;
        }

        if (quest.type === "research") {
          const stats = this.getStats();
          const value = stats.skills?.[quest.data] || 0;
          claimable = value >= target;
        }

        if (!claimable) break;

        await this.delayWithMessage(2, "Claiming side quest");
        await this.claimSideQuest(quest.key);
        this.logger.success(`Claimed side quest: ${quest.key}`);
      }
    }
  }

  /** Upgrade castle */
  async upgradeCastle() {
    return this.upgradeBuilding("castle");
  }

  /**
   * Upgrade building
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async upgradeBuilding(key) {
    /** Find owned building */
    const owned = this.findOwnedBuilding(key);

    /** Find building in dbData */
    const building = this.findGameBuilding(key);

    /** Already building - try to speedup or wait */
    if (this.hasBuildingTimer(key)) {
      const completed = await this.speedupOrWaitBuilding(key);
      if (completed) {
        await this.getBuildingInfo();
      }
      return completed;
    }

    /** Check if building can be purchased */
    const canPurchase = await this.checkBuildingRequirements(
      building,
      owned ? owned.level + 1 : 1,
    );

    if (!canPurchase) {
      await this.tryToMeetRequirements(building);
      this.logger.warn(`Can't purchase ${building.title} due to requirements`);
      return false;
    }

    /** Purchase building */
    await this.delayWithMessage(2, "Purchasing building");
    await this.purchaseLand(
      owned ? owned.position : this.getFreeBuildingPosition(),
      building.key,
    );

    /** Log success */
    this.logger.success(`Purchased building: ${building.title}`);

    /** Has timer - speedup or wait */
    if (this.hasBuildingTimer(key)) {
      const completed = await this.speedupOrWaitBuilding(key);
      if (completed) {
        await this.getBuildingInfo();
      }
      return completed;
    }

    return true;
  }

  async checkBuildingRequirements(building, level = 1) {
    /** Get requirements */
    const requirements = building.levels.find((item) => item.level === level);

    if (!requirements) {
      this.logger.warn(`Can't find LEVEL ${level} in ${building.title}`);
      return false;
    }

    /** Compare required buildings */
    const hasRequiredBuildings = await this.checkBuildings(
      requirements.requiredBuildings || {},
    );

    if (!hasRequiredBuildings) {
      this.logger.warn(`Building: ${building.title} needs other buildings.`);
      return false;
    }

    /** Compare resources */
    const resources = this.getAllResources();

    return (
      (requirements.priceFood || 0) <= (resources.food?.value || 0) &&
      (requirements.priceWood || 0) <= (resources.wood?.value || 0) &&
      (requirements.priceStone || 0) <= (resources.stone?.value || 0)
    );
  }

  async tryToMeetRequirements() {
    await this.claimResources();
    await this.completeGameQuests();
  }

  /**
   * Upgrade required buildings
   * @param {Record<string,number>} data
   * @returns {Promise<boolean>}
   */
  async checkBuildings(data) {
    for (const [key, level] of Object.entries(data)) {
      /** Signal aborted */
      if (this.signal.aborted) return false;

      /** Get owned building */
      let owned = this.findOwnedBuilding(key);

      while (!owned || owned.level < level) {
        /** Signal aborted */
        if (this.signal.aborted) return false;

        /** Upgrade building */
        const isUpgraded = await this.upgradeBuilding(key);

        if (!isUpgraded) return false;

        /** Updated owned building */
        owned = this.findOwnedBuilding(key);
      }
    }

    return true;
  }

  /** Train troops
   * @param {Record<string, number>} data
   */
  async trainTroops(data) {
    for (const [key, count] of Object.entries(data)) {
      /** Signal aborted */
      if (this.signal.aborted) return false;

      /** Find building */
      const building = this.findGameBuilding(key);

      /** Get owned building */
      const owned = this.findOwnedBuilding(key);

      if (!owned) {
        this.logger.warn(
          `Can't train troops - needs building: ${building.title}`,
        );
        return false;
      }

      const trainable = this.getBuildingTroops(key)
        .filter((item) => this.meetsTroopRequirements(item))
        .filter((item) => {
          const resources = this.getAllResources();
          const availableGem = resources.gem?.value || 0;

          const totalPriceFood = count * (item.priceFood || 0);
          const totalPriceWood = count * (item.priceWood || 0);
          const totalPriceStone = count * (item.priceStone || 0);
          const totalPriceGem = item.priceGem ? count * item.priceGem : 0;

          return (
            totalPriceFood <= (resources.food?.value || 0) &&
            totalPriceWood <= (resources.wood?.value || 0) &&
            totalPriceStone <= (resources.stone?.value || 0) &&
            totalPriceGem <= availableGem
          );
        });

      /** Choose troops */
      const selected = this.utils.randomItem(trainable);

      if (!selected) {
        await this.tryToMeetRequirements();
        this.logger.warn(
          `Can't train troops from ${building.title} - needs more resources`,
        );
        return false;
      }

      /** Purchase troops */
      await this.purchaseTroops(selected.key, count);
      this.logger.success(`Trained troops: ${selected.title}`);

      /** Speedup or wait for training */
      await this.speedupOrWaitTroops(selected.key);

      /** Refresh troops info */
      await this.getTroopsInfo();
    }

    return true;
  }

  /** Attack targets
   * @param {Record<string, number>} data
   */
  async attackTargets(data) {
    for (const [type, count] of Object.entries(data)) {
      /** Signal aborted */
      if (this.signal.aborted) return false;

      for (let i = 0; i < count; i++) {
        const availableTargets = this.findAvailableTargets(type);
        const selectedTarget = this.utils.randomItem(availableTargets);

        if (!selectedTarget) {
          this.logger.warn(`Can't find target to attack - ${type}`);
          return false;
        }

        /** Already attacking */
        if (this.hasAttackTimer(selectedTarget.id)) {
          this.logger.warn(`Already attacking: ${selectedTarget.id}`);
          return false;
        }

        if (selectedTarget.type === "camp") {
          const scouted = await this.scoutTarget(selectedTarget.id);
          if (!scouted) return false;
        }

        const selectedTroops = this.utils.randomItem(
          this.getAvailableAttackers(),
        );

        if (!selectedTroops) {
          this.logger.warn(
            `No troops to send for attack on target: ${selectedTarget.id}`,
          );
          return false;
        }

        /** Create a new attack */
        await this.createAttack(selectedTarget.id, {
          [selectedTroops.troop.key]: selectedTroops.count,
        });

        /** Log attack */
        this.logger.success(
          `Created attack on target: ${selectedTarget.id} using ${selectedTroops.troop.title}`,
        );

        /** Wait for full attack (attack + return) */
        await this.waitForFullAttack(selectedTarget.id);

        /** Read battle logs */
        await this.openLogs();
      }
    }

    return true;
  }

  /** Scout a target */
  async scoutTarget(targetId) {
    /** Has scout timer */
    if (this.hasScoutTimer(targetId)) {
      this.logger.warn(`Currently scouting: ${targetId}`);
      return false;
    }

    /** Check previous scouting logs - already scouted means we can attack */
    const logs = await this.getTargetLogs(targetId);
    const scoutLog = logs.find((item) => item.isScout);

    if (scoutLog) {
      this.logger.debug(`Target already scouted: ${targetId}`);
      return true;
    }

    const scouts = this.utils.randomItem(this.getAvailableScouts());

    if (!scouts) {
      return false;
    }

    /** Create scout */
    await this.delayWithMessage(3, "Creating scout");
    await this.createScout(targetId, {
      [scouts.troop.key]: scouts.count,
    });

    this.logger.success(`Created scout for target: ${targetId}`);

    /** Wait for full scout (scout + return) */
    await this.waitForFullScout(targetId);

    return true;
  }

  /** Wait for full scout */
  async waitForFullScout(targetId) {
    await this.waitForScout(targetId);
    await this.getAttackInfo();

    await this.waitForScoutReturn(targetId);
    await this.getTargetInfo(targetId);
  }

  /** Wait for full attack */
  async waitForFullAttack(targetId) {
    /** Wait for attack */
    await this.waitForAttack(targetId);
    await this.getAttackInfo();

    /** Wait for return */
    await this.waitForAttackReturn(targetId);
    await this.getTargetInfo(targetId);
  }

  /** Get speed up for timer */
  getSpeedUpForTimer(timer) {
    const diff = this.utils.dateFns.differenceInMinutes(
      new Date(this.normalizeDate(timer.dateEnd)),
      new Date(),
    );

    if (diff <= 0) return null;

    /** Get affordable speed ups */
    const affordableSpeedUps = this.getAffordableSpeedUps();
    /** Keep only usable speed ups */
    const usableSpeedUps = affordableSpeedUps.filter(
      (item) => diff >= item.minutes,
    );
    /** Find the highest */
    return usableSpeedUps.length
      ? usableSpeedUps.reduce((max, item) =>
          item.minutes > max.minutes ? item : max,
        )
      : null;
  }

  /**
   * Speed up or wait
   * @param {string} title
   * @param {string} timerKey
   * @param {string} itemKey
   * @param {string} value
   * @param {(timerId:string, speedUpKey:string)=>Promise<void>} applySpeedUp
   * @returns
   */
  async speedUpOrWait(title, timerKey, itemKey, value, applySpeedUp) {
    /* Refresh user timers */
    await this.getUserTimers();

    while (true) {
      /* Get timer */
      const timer = this.getTimer(timerKey, itemKey, value);
      if (!timer) return true;

      /* Get speed up for timer */
      const speedup = this.getSpeedUpForTimer(timer);

      /* If no usable speed-up → stop loop and wait */
      if (!speedup) break;

      /** Apply speed up */
      await this.delayWithMessage(3, "Speeding up timer");
      await applySpeedUp(timer.id, speedup.key);
      this.logger.success(`Speedup applied: ${value}`);

      /* Refresh timers after applying speed-up */
      await this.getUserTimers();

      /* If timer is gone after speed-up → we're done */
      if (!this.getTimer(timerKey, itemKey, value)) {
        return true;
      }
    }

    /* No more speed-ups possible → wait remaining time */
    await this.waitForTimer(title, timerKey, itemKey, value);

    return !this.getTimer(timerKey, itemKey, value);
  }

  /** Try to speedup a building timer with gems, or wait */
  async speedupOrWaitBuilding(key) {
    return this.speedUpOrWait(
      "Building",
      "tBuildings",
      "buildingKey",
      key,
      (timerId, speedUpKey) => this.speedupBuildingTimer(timerId, speedUpKey),
    );
  }

  /** Try to speedup a troops timer with gems, or wait */
  async speedupOrWaitTroops(key) {
    return this.speedUpOrWait(
      "Recruitment",
      "tTroops",
      "troopKey",
      key,
      (timerId, speedUpKey) => this.speedupTroopsTimer(timerId, speedUpKey),
    );
  }

  /** Is already attacking */
  hasAttackTimer(targetId) {
    return (
      this.getTimer("tAttacks", "targetId", targetId) ||
      this.getTimer("tReturns", "targetId", targetId)
    );
  }

  /** Is already scouting */
  hasScoutTimer(targetId) {
    return (
      this.getTimer("tScouts", "targetId", targetId) ||
      this.getTimer("tScoutReturns", "targetId", targetId)
    );
  }

  /** Is already building */
  hasBuildingTimer(buildingKey) {
    return this.getBuildingTimer(buildingKey);
  }

  /** Is troop timer available */
  hasTroopTimer(troopKey) {
    return this.getTroopTimer(troopKey);
  }

  /** Wait for building */
  async waitForBuilding(buildingKey) {
    return this.waitForTimer(
      "Building upgrade",
      "tBuildings",
      "buildingKey",
      buildingKey,
    );
  }

  /** Wait for recruitment */
  async waitForRecruitment(troopKey) {
    return this.waitForTimer("Recruitment", "tTroops", "troopKey", troopKey);
  }

  /** Wait for attack */
  async waitForAttack(targetId) {
    return this.waitForTimer("Attack", "tAttacks", "targetId", targetId);
  }

  /** Wait for return */
  async waitForAttackReturn(targetId) {
    return this.waitForTimer("Troops return", "tReturns", "targetId", targetId);
  }

  /** Wait for scout */
  async waitForScout(targetId) {
    return this.waitForTimer("Scout", "tScouts", "targetId", targetId);
  }

  /** Wait for scout return */
  async waitForScoutReturn(targetId) {
    return this.waitForTimer(
      "Scout return",
      "tScoutReturns",
      "targetId",
      targetId,
    );
  }

  /**
   * Wait for timer
   * @param {string} title
   * @param {string} timerKey
   * @param {string} itemKey
   * @param {string} value
   * @returns {Promise<void>}
   */
  async waitForTimer(title, timerKey, itemKey, value) {
    await this.getUserTimers();
    const target = this.getTimer(timerKey, itemKey, value);

    if (!target) return;

    const diff = this.utils.dateFns.differenceInSeconds(
      new Date(this.normalizeDate(target.dateEnd)),
      new Date(),
    );

    const MAX_WAIT_SECONDS = 60 * 5;

    if (diff > 0) {
      if (diff < MAX_WAIT_SECONDS) {
        this.logger.debug(`Waiting for ${title}: ${value} - ${diff}s`);
        await this.utils.delayForSeconds(diff + 1, {
          precised: true,
          signal: this.signal,
        });
        this.logger.success(`Completed ${title}: ${value}`);
        await this.getUserTimers();
      } else {
        this.logger.warn("Timer is longer than 5 minutes");
      }
    }
  }

  getTimer(timerKey, itemKey, value) {
    return this.allData[timerKey].find((item) => item[itemKey] === value);
  }

  getBuildingTimer(buildingKey) {
    return this.getTimer("tBuildings", "buildingKey", buildingKey);
  }

  getTroopTimer(troopKey) {
    return this.getTimer("tTroops", "troopKey", troopKey);
  }

  findAvailableTargets(key) {
    return this.afterData.targets.filter((item) => item.type === key);
  }

  getOwnedTroops() {
    return this.afterData.troops;
  }

  getAvailableTroops() {
    return Object.entries(this.getOwnedTroops())
      .map(([key, count]) => {
        const troop = this.allData.dbData.dbTroops.find(
          (item) => item.key === key,
        );
        return {
          troop,
          count,
        };
      })
      .filter((item) => item.count > 0);
  }

  getAvailableScouts() {
    return this.getAvailableTroops().filter((item) => item.troop.isScout);
  }

  getAvailableAttackers() {
    return this.getAvailableTroops().filter((item) => !item.troop.isScout);
  }

  getOwnedBuildings() {
    return this.allData.buildings;
  }

  findOwnedBuilding(key) {
    return this.getOwnedBuildings().find((b) => b.key === key);
  }

  findGameBuilding(key) {
    return this.allData.dbData.dbBuildings.find((b) => b.key === key);
  }

  /** Check if troop's building + skill requirements are met */
  meetsTroopRequirements(troop) {
    /** Check required buildings */
    if (troop.requiredBuildings) {
      for (const [bKey, bLevel] of Object.entries(troop.requiredBuildings)) {
        const owned = this.findOwnedBuilding(bKey);
        if (!owned || owned.level < bLevel) return false;
      }
    }

    /** Check required skills */
    if (troop.requiredSkills && troop.requiredSkills.length > 0) {
      for (const skillKey of troop.requiredSkills) {
        if (!this.hasSkill(skillKey)) return false;
      }
    }

    return true;
  }

  /** Check if a skill has been researched */
  hasSkill(skillKey) {
    return this.allData.skills?.some((s) => s.key === skillKey && s.level > 0);
  }

  getGameTroops() {
    return this.allData.dbData.dbTroops.filter(
      (item) => item.race === this.allData.hero.race,
    );
  }

  getBuildingTroops(key) {
    return this.getGameTroops().filter((item) => item.building === key);
  }

  getHero() {
    return this.allData.hero;
  }

  getTotalPower() {
    const hero = this.getHero();
    const totalPower =
      hero.powerBuildings + hero.powerTroops + hero.powerSkills;

    return totalPower;
  }

  getAllResources() {
    return this.allData.hero.resources;
  }

  getResource(type) {
    return this.getAllResources()[type];
  }

  getResourceValue(type) {
    return this.getResource(type)?.value || 0;
  }

  getGems() {
    return this.getResourceValue("gem");
  }

  /** Get affordable speed ups */
  getAffordableSpeedUps() {
    const gems = this.getGems();
    return this.allData.dbData.dbSpeedup.filter(
      (item) => gems >= item.priceGem,
    );
  }

  getFreeBuildingPosition() {
    const positions = Array.from({
      length: this.allData.dbData.dbBuildings.length,
    }).map((_, index) => index + 1);
    const available = positions.filter(
      (p) => !this.getOwnedBuildings().find((b) => b.position === p),
    );

    return available[0];
  }

  getCastle() {
    return this.findOwnedBuilding("castle");
  }

  getMaxOnboarding() {
    return Math.max(...this.allData.hero.onboarding.map(Number));
  }

  hasCompletedOnboarding(key) {
    return this.allData.hero.onboarding.includes(key);
  }

  hasClaimedMainQuest() {
    return this.allData.hero.questMainCompleted;
  }

  hasClaimedAnyResource() {
    return Object.values(this.getStats()["resourceClaim"]).some(
      (value) => value > 0,
    );
  }

  hasAttacked(data) {
    return this.compareStats("attack", data);
  }

  hasClaimedResource(data) {
    return this.compareStats("resourceClaim", data);
  }

  hasLootedResource(data) {
    return this.compareStats("resourceLoot", data);
  }

  hasTrainedTroops(data) {
    return this.compareStats("train", data);
  }

  hasTrainedBuilding(data) {
    return this.compareStats("trainBuilding", data);
  }

  compareStatsData(stats, data) {
    return data
      ? Object.entries(data).every(([key, value]) => {
          return stats[key] >= value;
        })
      : Object.values(stats).some((value) => value > 0);
  }

  compareStats(category, data) {
    const stats = this.getStats()[category];
    return this.compareStatsData(stats, data);
  }

  compareDailyStats(category, data) {
    const stats = this.getDailyStats()[category];
    return this.compareStatsData(stats, data);
  }

  getStats() {
    return this.allData.hero.stat;
  }

  getDailyStats() {
    return this.allData.hero.statDaily;
  }

  getTargets() {
    return this.afterData.targets;
  }
}
