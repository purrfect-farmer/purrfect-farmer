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

  speedupTimer(timerId, speedUpKey) {
    return this.api
      .post("https://api.fomofighters.xyz/building/buy", {
        timerId,
        speedUpKey,
      })
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

    await this.executeTask("Onboarding", () => this.completeOnboarding());
    await this.executeTask("Resources", () => this.claimGameResources());
    await this.executeTask("Quests", () => this.completeGameQuests());
    await this.executeTask("Daily reward", () => this.getDailyReward());
  }

  async getDailyReward() {
    const dailyReward = Object.entries(this.afterData.questDailyRewards).find(
      ([key, value]) => value === "canTake",
    );

    if (dailyReward) {
      await this.claimDailyQuest(dailyReward[0]);
      this.logger.success("Claimed daily reward");
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

  async completeOnboarding() {
    /** Accept terms */
    if (this.allData.hero.onboarding.length === 0) {
      await this.finishOnboarding(1);
      this.logger.success("Accepted terms!");
    }

    /** Select race */
    if (!this.allData.hero.race) {
      const race = this.utils.randomItem(
        this.allData.dbData.dbRaces.filter((item) => item.type === "people"),
      );
      await this.selectRace(race.key);
      this.logger.success(`Selected race: ${race.title} - ${race.desc}`);
    }

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

      /** Upgrade castle */
      if (onboarding.action === "/city/castle") {
        const upgraded = await this.upgradeCastle();
        if (!upgraded) return;
      }

      /** Complete onboarding */
      if (onboarding.isCompleteAfterClick) {
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
        await this.claimResource(resource.key);
        this.logger.success(`Claimed: ${resource.title}`);
        await this.utils.delayForSeconds(1, { signal: this.signal });
      }
    }
  }

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
      await this.readAllBattleLogs();
      await this.utils.delayForSeconds(1, { signal: this.signal });
    }
  }

  async completeSideQuests() {
    // TODO: check hero.questsSideCompleted
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

      if (claimable) {
        await this.claimMainQuest(quest.key);
        this.logger.success(`Claimed main quest: ${quest.key}`);
        await this.utils.delayForSeconds(1, { signal: this.signal });
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
        await this.checkQuest(riddle.key, riddle.checkData);
      }

      if (!riddleQuest || !riddleQuest.isRewarded) {
        await this.claimQuest(riddle.key);
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

        if (!claimable) break;

        await this.claimSideQuest(quest.key);
        this.logger.success(`Claimed side quest: ${quest.key}`);
        await this.utils.delayForSeconds(1, { signal: this.signal });
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

    /** Already building */
    if (this.hasBuildingTimer(key)) {
      this.logger.warn(`Already building: ${building.title}`);
      return false;
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
    await this.purchaseLand(
      owned ? owned.position : this.getFreeBuildingPosition(),
      building.key,
    );

    /** Log success */
    this.logger.success(`Purchased building: ${building.title}`);

    /** Has timer */
    if (this.hasBuildingTimer(key)) {
      this.logger.warn(
        `Needs to wait for building building: ${building.title}`,
      );
      return false;
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
      requirements.priceFood <= resources.food.value &&
      requirements.priceWood <= resources.wood.value &&
      requirements.priceStone <= resources.stone.value
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
        .filter((item) => item.requiredBuildingLevel <= owned.level)
        .filter((item) => {
          const resources = this.getAllResources();
          const availableGem = resources.gem?.value || 0;

          const totalPriceFood = count * item.priceFood;
          const totalPriceWood = count * item.priceWood;
          const totalPriceStone = count * item.priceStone;
          const totalPriceGem = item.priceGem ? count * item.priceGem : 0;

          return (
            totalPriceFood <= resources.food.value &&
            totalPriceWood <= resources.wood.value &&
            totalPriceStone <= resources.stone.value &&
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

      /** Wait for training */
      await this.waitForRecruitment(selected.key);
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

        /** Has attack timer */
        if (this.hasAttackTimer(selectedTarget.id)) {
          this.logger.warn(`Needs to wait for attack: ${selectedTarget.id}`);
          return false;
        }
      }
    }

    /** Get attack info */
    await this.getAttackInfo();

    return true;
  }

  /** Scout a target */
  async scoutTarget(targetId) {
    /** Has scout timer */
    if (this.hasScoutTimer(targetId)) {
      this.logger.warn(`Currently scouting: ${targetId}`);
      return false;
    }

    /** Check previous scouting logs */
    const logs = await this.getTargetLogs(targetId);
    const scoutLog = logs.find((item) => item.isScout);

    if (scoutLog) {
      this.logger.warn(`Target scouted already: ${targetId}`);
      return false;
    }

    const scouts = this.utils.randomItem(this.getAvailableScouts());

    if (!scouts) {
      return false;
    }

    /** Create scout */
    await this.createScout(targetId, {
      [scouts.troop.key]: scouts.count,
    });

    this.logger.success(`Created scout for target: ${targetId}`);

    /** Has scout timer */
    if (this.hasScoutTimer(targetId)) {
      this.logger.warn(`Needs to wait for scouting: ${targetId}`);
      return false;
    }

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
    return this.getTimer("tBuildings", "buildingKey", buildingKey);
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

    if (diff > 0) {
      this.logger.debug(`Waiting for ${title}: ${value} - ${diff}s`);
      await this.utils.delayForSeconds(diff + 1, {
        precised: true,
        signal: this.signal,
      });
      this.logger.success(`Completed ${title}: ${value}`);
      await this.getUserTimers();
    }
  }

  getTimer(timerKey, itemKey, value) {
    return this.allData[timerKey].find((item) => item[itemKey] === value);
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

  getAllResources() {
    return this.allData.hero.resources;
  }

  getResource(type) {
    return this.getAllResources()[type];
  }

  getFreeBuildingPosition() {
    const positions = Array.from({ length: 22 }).map((_, index) => index + 1);
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

  compareStats(category, data) {
    const stats = this.getStats()[category];
    return data
      ? Object.entries(data).every(([key, value]) => {
          return stats[key] >= value;
        })
      : Object.values(stats).some((value) => value > 0);
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
