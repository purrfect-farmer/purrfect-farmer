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
  static startupDelay = 60;
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

  claimAllClanRewards() {
    return this.api
      .post("https://api.fomofighters.xyz/clan/rewards/claim-all", {})
      .then((res) => res.data.data);
  }

  hospitalHeal(troops) {
    return this.api
      .post("https://api.fomofighters.xyz/hospital/heal", { troops })
      .then((res) => res.data.data);
  }

  buySkill(skillKey) {
    return this.api
      .post("https://api.fomofighters.xyz/skills/buy", { skillKey })
      .then((res) => res.data.data);
  }

  claimStoryDailyReward(rewardKey) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/story/daily/reward/claim", [
        rewardKey,
      ])
      .then((res) => res.data.data);
  }

  getWarLogs() {
    return this.api
      .post("https://api.fomofighters.xyz/war/logs", {})
      .then((res) => res.data.data);
  }

  claimWarReward(warId) {
    return this.api
      .post("https://api.fomofighters.xyz/war/reward/claim", warId)
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

  refreshMarket() {
    return this.api
      .post("https://api.fomofighters.xyz/market/refresh", {})
      .then((res) => res.data.data);
  }

  buyFromMarket(key, marketId) {
    return this.api
      .post("https://api.fomofighters.xyz/market/buy", { key, marketId })
      .then((res) => res.data.data);
  }

  getBoxList() {
    return this.api
      .post("https://api.fomofighters.xyz/box/list", {})
      .then((res) => res.data.data);
  }

  buyBox(key, count = 1) {
    return this.api
      .post("https://api.fomofighters.xyz/box/buy", { key, count })
      .then((res) => res.data.data);
  }

  openBox(key) {
    return this.api
      .post("https://api.fomofighters.xyz/box/open", key)
      .then((res) => res.data.data);
  }

  buySkillInstant(skillKey, expectedPrice) {
    return this.api
      .post("https://api.fomofighters.xyz/skills/buy/instant", {
        skillKey,
        expectedPrice,
      })
      .then((res) => res.data.data);
  }

  buyResourcePacks(packs) {
    return this.api
      .post("https://api.fomofighters.xyz/resource/buy/packs", packs)
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

    if (this.getHeroLevel() >= 2) {
      await this.executeTask("Building upgrades", () =>
        this.performBuildingUpgrades(),
      );

      await this.executeTask("Research skills", () => this.researchSkills());

      await this.executeTask("Train troops", () => this.trainAvailableTroops());
      await this.executeTask("Attacks", () => this.performAttacks());
      await this.executeTask("Heal troops", () => this.healWoundedTroops());
      await this.executeTask("Market", () => this.buyMarketItems());
      await this.executeTask("Chests", () => this.buyAndOpenBoxes());

      await this.executeTask("Resources (2nd pass)", () =>
        this.claimGameResources(),
      );
      await this.executeTask("Quests (2nd pass)", () =>
        this.completeGameQuests(),
      );
    }

    await this.executeTask("Clan rewards", () => this.claimClanRewards());
    await this.executeTask("War rewards", () => this.claimWarRewards());
    await this.executeTask("Story daily quests", () =>
      this.completeStoryDailyQuests(),
    );
    await this.executeTask("Story daily milestones", () =>
      this.claimStoryDailyMilestoneRewards(),
    );
  }

  logUserInfo() {
    this.logger.keyValue("Hero Level", this.getHeroLevel());
    this.logger.keyValue("Race", this.getRace() || "Not selected");
    this.logger.keyValue("Power", this.getTotalPower());
    this.logger.keyValue("Food", this.getFood());
    this.logger.keyValue("Wood", this.getWood());
    this.logger.keyValue("Stone", this.getStone());
    this.logger.keyValue("Gems", this.getGems());
    this.logger.keyValue("Buildings", this.getOwnedBuildings().length);
    this.logger.keyValue("Kill Points", this.getKillPoints());
    this.logger.keyValue("Clan", this.isInClan() ? "Yes" : "No");
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
    if (!this.isInClan()) {
      this.logger.debug("Not in a clan - skipping clan rewards");
      return;
    }

    /** Bulk claim all available clan rewards */
    try {
      await this.delayWithMessage(3, "Claiming clan rewards");
      await this.claimAllClanRewards();
      this.logger.success("Claimed all clan rewards");
    } catch {
      this.logger.debug("No clan rewards available");
    }
  }

  /** Claim unclaimed war rewards */
  async claimWarRewards() {
    if (!this.isInClan()) {
      this.logger.debug("Not in a clan - skipping war rewards");
      return;
    }

    const unclaimed = this.getUnclaimedWars();

    for (const war of unclaimed) {
      if (this.signal.aborted) return;

      try {
        await this.delayWithMessage(3, "Claiming war reward");
        await this.claimWarReward(war.id);
        this.logger.success(`Claimed war reward: ${war.id}`);
      } catch {
        this.logger.debug(`War reward not claimable: ${war.id}`);
      }
    }
  }

  /** Heal all wounded troops in hospital */
  async healWoundedTroops() {
    const attackInfo = await this.getAttackInfo();
    const hospital = attackInfo?.hospital || this.afterData?.hospital;

    if (!hospital) return;

    const available = hospital.available;
    if (!available || typeof available !== "object") return;

    /** available can be an empty array or an object of troops */
    const troops = Array.isArray(available) ? null : available;

    if (!troops || Object.keys(troops).length === 0) return;

    await this.delayWithMessage(2, "Healing wounded troops");
    await this.hospitalHeal(troops);
    this.logger.success(
      `Healed ${Object.values(troops).reduce((a, b) => a + b, 0)} troops`,
    );
  }

  /** Research available academy skills */
  async researchSkills() {
    const academy = this.findOwnedBuilding("academy");
    if (!academy) {
      this.logger.debug("No academy - skipping skills");
      return;
    }

    /** Skip if already researching */
    if (this.getActiveResearches() >= this.getAcademics()) {
      this.logger.debug("Already researching a skill");
      return;
    }

    const dbSkills = this.allData.dbData.dbSkills || [];
    const ownedSkills = this.getOwnedSkills();

    for (const skill of dbSkills) {
      if (this.signal.aborted) return;

      /** Get current level */
      const owned = ownedSkills.find((s) => s.key === skill.key);
      const currentLevel = owned ? owned.level : 0;

      /** Find next level */
      const nextLevel = skill.levels?.find((l) => l.level === currentLevel + 1);
      if (!nextLevel) continue;

      /** Check required buildings (includes academy level) */
      if (nextLevel.requiredBuildings) {
        let meetsBuildings = true;
        for (const [bKey, bLevel] of Object.entries(
          nextLevel.requiredBuildings,
        )) {
          const ownedB = this.findOwnedBuilding(bKey);
          if (!ownedB || ownedB.level < bLevel) {
            meetsBuildings = false;
            break;
          }
        }
        if (!meetsBuildings) continue;
      }

      /** Check required skills */
      if (nextLevel.requiredSkills) {
        const hasAll = Object.entries(nextLevel.requiredSkills).every(
          ([sKey, sLevel]) => {
            const s = ownedSkills.find((os) => os.key === sKey);
            return s && s.level >= sLevel;
          },
        );
        if (!hasAll) continue;
      }

      /** Check resource cost */
      if (
        !this.canAfford(
          nextLevel.priceFood || 0,
          nextLevel.priceWood || 0,
          nextLevel.priceStone || 0,
        )
      ) {
        continue;
      }

      /** Buy skill */
      await this.delayWithMessage(2, `Researching ${skill.key}`);
      await this.buySkill(skill.key);
      this.logger.success(
        `Researching skill: ${skill.key} (level ${currentLevel + 1})`,
      );

      /** Only one research at a time */
      return;
    }
  }

  /** Claim story daily milestone rewards */
  async claimStoryDailyMilestoneRewards() {
    const milestones = this.allData.dbData.dbQuestsStoryDailyRewards || [];

    for (const milestone of milestones) {
      if (this.signal.aborted) return;

      try {
        await this.delayWithMessage(2, `Claiming milestone: ${milestone.key}`);
        await this.claimStoryDailyReward(milestone.key);
        this.logger.success(`Claimed story daily milestone: ${milestone.key}`);
      } catch {
        break;
      }
    }
  }

  /** Buy discounted items from the market */
  async buyMarketItems() {
    const market = this.afterData.market;
    if (!market?.list?.length) return;

    /** Only buy gem-priced items (troops) since gems have more value */
    const gemItems = market.list.filter(
      (item) =>
        item.priceType === "gem" &&
        item.priceCount <= this.getGems() &&
        (!item.race || item.race === this.getRace()),
    );

    for (const item of gemItems) {
      if (this.signal.aborted) return;

      await this.delayWithMessage(2, `Buying from market: ${item.key}`);
      try {
        await this.buyFromMarket(item.key, market.id);
        this.logger.success(`Bought from market: ${item.key}`);
      } catch {
        this.logger.debug(`Failed to buy from market: ${item.key}`);
      }
    }
  }

  /** Buy and open resource chests from fairground */
  async buyAndOpenBoxes() {
    const fairground = this.findOwnedBuilding("fairground");
    if (!fairground) return;

    const boxes = this.allData.dbData.dbBoxes;
    if (!boxes?.length) return;

    for (const box of boxes) {
      if (this.signal.aborted) return;

      /** Only buy gem-priced boxes we can afford */
      if (box.priceType !== "gem" || box.priceGem > this.getGems()) continue;

      try {
        await this.delayWithMessage(2, `Buying chest: ${box.title}`);
        await this.buyBox(box.key);
        this.logger.success(`Bought chest: ${box.title}`);

        await this.delayWithMessage(2, `Opening chest: ${box.title}`);
        const result = await this.openBox(box.key);
        if (result?.loot) {
          for (const loot of result.loot) {
            this.logger.success(
              `Received ${loot.count} ${loot.data} from chest`,
            );
          }
        }
      } catch {
        this.logger.debug(`Failed to buy/open chest: ${box.title}`);
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

      const value = this.getDailyStatValue(quest.type, quest.data);
      const claimable = value >= quest.count;

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

    await this.delayWithMessage(3, "Attacking target");
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

      /** Skip if this building is already training */
      if (this.hasTrainingAtBuilding(building.key)) {
        this.logger.debug(`Already training at ${building.key}`);
        continue;
      }

      /** Get training capacity for this building */
      const capacity = this.getTrainingCapacity(building.key);

      /** Find best trainable troop for this building */
      const trainable = this.getBuildingTroops(building.key)
        .filter((item) => this.meetsTroopRequirements(item))
        .filter((item) =>
          this.canAfford(
            capacity * (item.priceFood || 0),
            capacity * (item.priceWood || 0),
            capacity * (item.priceStone || 0),
            capacity * (item.priceGem || 0),
          ),
        )
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
    const castleLevel = this.getCastleLevel();
    const maxBuilders = this.getBuilders();

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

      /** Check builder slot availability */
      if (this.getActiveBuilds() >= maxBuilders) {
        this.logger.debug("All builder slots occupied");
        break;
      }

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

      /** Complete TG quest if not claimed */
      if (checkType === "notClaimQuestTg") {
        await this.completePremiumQuests();
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
        const total = Object.values(this.getStats().train || {}).reduce(
          (result, value) => result + value,
          0,
        );
        claimable = total >= quest.count;
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
        claimable = this.getStatValue("resourceBuy", quest.data) >= quest.count;
      }

      if (quest.type === "clan") {
        claimable = this.getStatValue("clan", quest.data) >= quest.count;
      }

      if (quest.type === "research") {
        claimable = this.getStatValue("skills", quest.data) >= quest.count;
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
    const quests = this.allData.dbData.dbQuests;
    const automatableTypes = [
      "checkCode",
      "fakeCheck",
      "telegramChannel",
      "username",
    ];

    for (const quest of quests) {
      if (this.signal.aborted) return;
      if (quest.isArchived) continue;
      if (!automatableTypes.includes(quest.checkType)) continue;

      const completed = this.afterData.quests.find(
        (item) => item.key === quest.key,
      );

      /** Skip if already rewarded (unless repeatable) */
      if (completed?.isRewarded && !quest.repeatInterval) continue;

      try {
        /** fakeCheck: claim directly without check */
        if (quest.checkType === "fakeCheck") {
          if (!completed || !completed.isRewarded) {
            await this.delayWithMessage(2, `Claiming quest: ${quest.title}`);
            await this.claimQuest(quest.key);
            this.logger.success(`Claimed quest: ${quest.title}`);
          }
          continue;
        }

        /** telegramChannel: join link first, then check + claim */
        if (quest.checkType === "telegramChannel") {
          if (!completed) {
            if (quest.actionUrl && this.canJoinTelegramLink()) {
              await this.delayWithMessage(2, `Joining: ${quest.title}`);
              await this.joinTelegramLink(quest.actionUrl);
            }
            await this.delayWithMessage(2, `Checking quest: ${quest.title}`);
            const result = await this.checkQuest(quest.key, null);
            if (!result?.result) continue;
          }
          if (!completed || !completed.isRewarded) {
            await this.delayWithMessage(2, `Claiming quest: ${quest.title}`);
            await this.claimQuest(quest.key);
            this.logger.success(`Claimed quest: ${quest.title}`);
          }
          continue;
        }

        /** checkCode: check with answer, only claim if check succeeds */
        if (quest.checkType === "checkCode") {
          if (!completed) {
            await this.delayWithMessage(2, `Checking quest: ${quest.title}`);
            const result = await this.checkQuest(quest.key, quest.checkData);
            if (!result?.result) continue;
          }
          if (!completed || !completed.isRewarded) {
            await this.delayWithMessage(2, `Claiming quest: ${quest.title}`);
            await this.claimQuest(quest.key);
            this.logger.success(`Claimed quest: ${quest.title}`);
          }
          continue;
        }

        /** username: check then claim if check succeeds */
        if (quest.checkType === "username") {
          if (!completed) {
            await this.delayWithMessage(2, `Checking quest: ${quest.title}`);
            const result = await this.checkQuest(quest.key, null);
            if (!result?.result) continue;
          }
          if (!completed || !completed.isRewarded) {
            await this.delayWithMessage(2, `Claiming quest: ${quest.title}`);
            await this.claimQuest(quest.key);
            this.logger.success(`Claimed quest: ${quest.title}`);
          }
          continue;
        }
      } catch {
        this.logger.debug(`Quest not claimable: ${quest.title}`);
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
          claimable = this.getStatValue("resourceBuy", quest.data) >= target;
        }

        if (quest.type === "trainBuilding") {
          claimable = this.hasTrainedBuilding({ [quest.data]: target });
        }

        if (quest.type === "clan") {
          claimable = this.getStatValue("clan", quest.data) >= target;
        }

        if (quest.type === "killPoints") {
          claimable = this.getKillPoints() >= target;
        }

        if (quest.type === "research") {
          claimable = this.getStatValue("skills", quest.data) >= target;
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
    return this.canAfford(
      requirements.priceFood || 0,
      requirements.priceWood || 0,
      requirements.priceStone || 0,
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
        .filter((item) =>
          this.canAfford(
            count * (item.priceFood || 0),
            count * (item.priceWood || 0),
            count * (item.priceStone || 0),
            count * (item.priceGem || 0),
          ),
        );

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
      await this.delayWithMessage(2, `Training ${selected.title}`);
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
        await this.delayWithMessage(3, "Attacking target");
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

  /** ===== Data Accessors ===== */

  /** Hero */
  getHero() {
    return this.allData.hero;
  }

  getHeroLevel() {
    return this.getHero().level;
  }

  getRace() {
    return this.getHero().race;
  }

  getKillPoints() {
    return this.getHero().killPoints || 0;
  }

  getOnboarding() {
    return this.getHero().onboarding;
  }

  getPropsCompiled() {
    return this.getHero().propsCompiled;
  }

  getBuilders() {
    return this.getPropsCompiled()?.builders || 1;
  }

  getAcademics() {
    return this.getPropsCompiled()?.academics || 1;
  }

  /** Power */
  getTotalPower() {
    const hero = this.getHero();
    return hero.powerBuildings + hero.powerTroops + hero.powerSkills;
  }

  getBuildingPower() {
    return this.getHero().powerBuildings;
  }

  getTroopPower() {
    return this.getHero().powerTroops;
  }

  getSkillPower() {
    return this.getHero().powerSkills;
  }

  /** Resources */
  getAllResources() {
    return this.getHero().resources;
  }

  getResource(type) {
    return this.getAllResources()[type];
  }

  getResourceValue(type) {
    return this.getResource(type)?.value || 0;
  }

  getFood() {
    return this.getResourceValue("food");
  }

  getWood() {
    return this.getResourceValue("wood");
  }

  getStone() {
    return this.getResourceValue("stone");
  }

  getGems() {
    return this.getResourceValue("gem");
  }

  canAfford(food = 0, wood = 0, stone = 0, gems = 0) {
    return (
      food <= this.getFood() &&
      wood <= this.getWood() &&
      stone <= this.getStone() &&
      gems <= this.getGems()
    );
  }

  /** Buildings */
  getOwnedBuildings() {
    return this.allData.buildings;
  }

  findOwnedBuilding(key) {
    return this.getOwnedBuildings().find((b) => b.key === key);
  }

  findGameBuilding(key) {
    return this.allData.dbData.dbBuildings.find((b) => b.key === key);
  }

  getOwnedBuildingLevel(key) {
    return this.findOwnedBuilding(key)?.level || 0;
  }

  getCastle() {
    return this.findOwnedBuilding("castle");
  }

  getCastleLevel() {
    return this.getHeroLevel();
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

  /** Troops */
  getOwnedTroops() {
    return this.afterData.troops;
  }

  getAvailableTroops() {
    return Object.entries(this.getOwnedTroops())
      .map(([key, count]) => {
        const troop = this.allData.dbData.dbTroops.find(
          (item) => item.key === key,
        );
        return { troop, count };
      })
      .filter((item) => item.count > 0);
  }

  getAvailableScouts() {
    return this.getAvailableTroops().filter((item) => item.troop.isScout);
  }

  getAvailableAttackers() {
    return this.getAvailableTroops().filter((item) => !item.troop.isScout);
  }

  getGameTroops() {
    return this.allData.dbData.dbTroops.filter(
      (item) => item.race === this.getRace(),
    );
  }

  getBuildingTroops(key) {
    return this.getGameTroops().filter((item) => item.building === key);
  }

  getTrainingCapacity(buildingKey) {
    const capacityKey = this.utils.changeCase.camelCase(
      `training_capacity_${buildingKey}`,
    );
    return this.getPropsCompiled()?.[capacityKey] || 1;
  }

  getArmyCapacity(buildingKey) {
    const capacityKey = this.utils.changeCase.camelCase(
      `army_capacity_${buildingKey}`,
    );
    return this.getPropsCompiled()?.[capacityKey] || 0;
  }

  /** Skills */
  getOwnedSkills() {
    return this.allData.skills || [];
  }

  getSkillLevel(skillKey) {
    const skill = this.getOwnedSkills().find((s) => s.key === skillKey);
    return skill ? skill.level : 0;
  }

  hasSkill(skillKey) {
    return this.getSkillLevel(skillKey) > 0;
  }

  /** Troop requirements */
  meetsTroopRequirements(troop) {
    if (troop.requiredBuildings) {
      for (const [bKey, bLevel] of Object.entries(troop.requiredBuildings)) {
        if (this.getOwnedBuildingLevel(bKey) < bLevel) return false;
      }
    }

    if (troop.requiredSkills && troop.requiredSkills.length > 0) {
      for (const skillKey of troop.requiredSkills) {
        if (!this.hasSkill(skillKey)) return false;
      }
    }

    return true;
  }

  /** Speedups */
  getAffordableSpeedUps() {
    const gems = this.getGems();
    return this.allData.dbData.dbSpeedup.filter(
      (item) => gems >= item.priceGem,
    );
  }

  /** Clan */
  isInClan() {
    return this.allData.clan && this.allData.clan.length > 0;
  }

  getClan() {
    return this.allData.clan;
  }

  getClanRewards() {
    return this.afterData.stClanRewards || [];
  }

  getWarLogs() {
    return this.afterData.warLogs || [];
  }

  getUnclaimedWars() {
    return this.getWarLogs().filter((w) => !w.isClaimed && !w.isExpired);
  }

  getWarPoints() {
    return this.afterData.warPoints || 0;
  }

  /** Hospital */
  getHospital() {
    return this.afterData?.hospital || null;
  }

  getHospitalCapacity() {
    return this.getPropsCompiled()?.hospitalCapacity || 0;
  }

  /** Targets */
  getTargets() {
    return this.afterData.targets;
  }

  findAvailableTargets(key) {
    return this.getTargets().filter((item) => item.type === key);
  }

  /** Timers */
  getTimer(timerKey, itemKey, value) {
    return this.allData[timerKey]?.find((item) => item[itemKey] === value);
  }

  getBuildingTimer(buildingKey) {
    return this.getTimer("tBuildings", "buildingKey", buildingKey);
  }

  getTroopTimer(troopKey) {
    return this.getTimer("tTroops", "troopKey", troopKey);
  }

  getBuildingTimerByBuilding(buildingKey) {
    return this.allData.tTroops?.find((t) => t.buildingKey === buildingKey);
  }

  getActiveBuilds() {
    return this.allData.tBuildings?.length || 0;
  }

  getActiveResearches() {
    return this.allData.tSkills?.length || 0;
  }

  /** Onboarding */
  getMaxOnboarding() {
    return Math.max(...this.getOnboarding().map(Number));
  }

  hasCompletedOnboarding(key) {
    return this.getOnboarding().includes(key);
  }

  /** Stats */
  getStats() {
    return this.getHero().stat;
  }

  getDailyStats() {
    return this.getHero().statDaily;
  }

  getStatValue(category, key) {
    return this.getStats()[category]?.[key] || 0;
  }

  getDailyStatValue(category, key) {
    return this.getDailyStats()[category]?.[key] || 0;
  }

  /** Quest state checks */
  hasClaimedMainQuest() {
    return this.getHero().questMainCompleted;
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
      ? Object.entries(data).every(([key, value]) => stats[key] >= value)
      : Object.values(stats).some((value) => value > 0);
  }

  compareStats(category, data) {
    return this.compareStatsData(this.getStats()[category], data);
  }

  compareDailyStats(category, data) {
    return this.compareStatsData(this.getDailyStats()[category], data);
  }

  /** Timer checks */
  hasAttackTimer(targetId) {
    return (
      this.getTimer("tAttacks", "targetId", targetId) ||
      this.getTimer("tReturns", "targetId", targetId)
    );
  }

  hasScoutTimer(targetId) {
    return (
      this.getTimer("tScouts", "targetId", targetId) ||
      this.getTimer("tScoutReturns", "targetId", targetId)
    );
  }

  hasBuildingTimer(buildingKey) {
    return this.getBuildingTimer(buildingKey);
  }

  hasTroopTimer(troopKey) {
    return this.getTroopTimer(troopKey);
  }

  hasTrainingAtBuilding(buildingKey) {
    return !!this.getBuildingTimerByBuilding(buildingKey);
  }
}
