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

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/fomo_fighters_bot/game?startapp=ref${this.getUserId()}`;
  }

  /* Configure Api */
  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      config.data = { data: config.data };
      config.headers = {
        ...config.headers,
        ...this.getSignedHeaders(config.data),
      };

      return config;
    });

    return () => {
      return this.api.interceptors.request.eject(interceptor);
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
  }

  async completeOnboarding() {
    /** Accept terms */
    if (this.allData.hero.onboarding.length === 0) {
      const result = await this.finishOnboarding(1);
      this.allData.hero = { ...this.allData.hero, ...result };
      this.logger.success("Accepted terms!");
    }

    /** Select race */
    if (!this.allData.hero.race) {
      const race = this.utils.randomItem(
        this.allData.dbData.dbRaces.filter((item) => item.type === "people"),
      );
      const result = await this.selectRace(race.key);
      this.allData = { ...this.allData, ...result };
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
        await this.claimResources();
      }

      /** Claim main story quest */
      if (checkType === "claimQuestStoryMain") {
        const claimed = await this.completeMainQuest();
        if (!claimed) return;
      }

      /** Claim quests */
      if (checkType === "claimQuests") {
        const claimed = await this.completeMainQuest();
        if (!claimed) return;
      }

      /** Train troops */
      if (checkType === "trainBuilding") {
        const trained = await this.trainTroops(onboarding.data);
        if (!trained) return;
      }

      /** Attack */
      if (checkType === "attack") {
        const attacked = await this.attackTargets(onboarding.data);
        if (!attacked) return;
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
        const result = await this.finishOnboarding(onboarding.key);
        this.allData.hero = { ...this.allData.hero, ...result };
        this.debugger.log("Hero:", this.allData.hero);
        this.logger.success(`Completed onboarding: ${onboarding.title}`);
        await this.utils.delayForSeconds(1);
      }
    }
  }

  async claimResources() {
    for (const resource of ["food", "wood", "stone"]) {
      const result = await this.claimResource(resource);
      this.allData = { ...this.allData, ...result };
      this.logger.success(`Claimed resource: ${resource.toUpperCase()}`);
    }
  }

  /** Open logs */
  async openLogs() {
    const logs = await this.getBattleLogs();
    const unread = logs.filter((item) => !item.isRead);
    await this.readAllBattleLogs();
  }

  async completeSideQuests() {
    // TODO: check hero.questsSideCompleted
  }

  async completeMainQuest() {
    /** Get db quests */
    const quests = this.allData.dbData.dbQuestsMain;

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

    if (quest.type === "build") {
      const owned = this.findOwnedBuilding(quest.data);

      if (owned && owned.level >= quest.count) {
        const result = await this.claimMainQuest(quest.key);
        this.allData = { ...this.allData, ...result };

        return true;
      }
    }

    return false;
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

    /** Check if building can be purchased */
    const canPurchase = this.checkBuildingRequirements(
      building,
      owned ? owned.level + 1 : 1,
    );

    if (!canPurchase) return false;

    /** Purchase building */
    const result = await this.purchaseLand(
      owned ? owned.position : this.getFreeBuildingPosition(),
      building.key,
    );

    /** Log success */
    this.logger.success(`Purchased building: ${building.title}`);

    /** Update data */
    this.allData = { ...this.allData, ...result };

    /** Wait for building */
    await this.waitForBuilding(building.key);

    return true;
  }

  checkBuildingRequirements(building, level = 1) {
    /** Get requirements */
    const requirements = building.levels.find((item) => item.level === level);

    if (!requirements) return false;

    /** Compare required buildings */
    const hasRequiredBuildings = Object.entries(
      requirements.requiredBuildings,
    ).every(([key, requiredLevel]) => {
      const owned = this.findOwnedBuilding(key);
      return owned && owned.level >= requiredLevel;
    });

    if (!hasRequiredBuildings) return false;

    /** Compare resources */
    const resources = this.getAllResources();

    return (
      requirements.priceFood <= resources.food.value &&
      requirements.priceWood <= resources.wood.value &&
      requirements.priceStone <= resources.stone.value
    );
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

      /** Get owned building */
      const owned = this.findOwnedBuilding(key);

      if (!owned) return false;

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

      if (!selected) return false;

      /** Purchase troops */
      const result = await this.purchaseTroops(selected.key, count);
      this.logger.success(`Trained troops: ${selected.title}`);
      this.allData = { ...this.allData, ...result };

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

        if (!selectedTarget) return false;

        if (selectedTarget.type === "camp") {
          const scouted = await this.scoutTarget(selectedTarget.id);
          if (!scouted) return false;
        }

        const selectedTroops = this.utils.randomItem(
          this.getAvailableAttackers(),
        );

        if (!selectedTroops) return false;
        const result = await this.createAttack(selectedTarget.id, {
          [selectedTroops.troop.key]: selectedTroops.count,
        });

        /** Wait for attack */
        await this.waitForAttack(selectedTarget.id);
        await this.getAttackInfo();

        /** Wait for return */
        await this.waitForReturn(selectedTarget.id);
        await this.getTargetInfo(selectedTarget.id);
      }
    }

    const info = await this.getAttackInfo();
    this.allData = { ...this.allData, ...info };

    return true;
  }

  /** Scout a target */
  async scoutTarget(targetId) {
    const scouts = this.utils.randomItem(this.getAvailableScouts());

    if (!scouts) {
      return false;
    }
    const result = await this.createScout(targetId, {
      [scouts.troop.key]: scouts.count,
    });

    await this.waitForScout(targetId);
    await this.getAttackInfo();

    await this.waitForScoutReturn(targetId);
    await this.getTargetInfo(targetId);

    return true;
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
  async waitForReturn(targetId) {
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
    const timers = await this.getUserTimers();
    const target = timers[timerKey].find((item) => item[itemKey] === value);

    if (!target) return;

    const diff = this.utils.dateFns.differenceInSeconds(
      new Date(`${target.dateEnd}Z`),
      new Date(),
    );

    if (diff > 0) {
      this.logger.debug(`Waiting for ${title}: ${value}`);
      await this.utils.delayForSeconds(diff + 1, {
        precised: true,
        signal: this.signal,
      });
      this.logger.success(`Completed ${title}: ${value}`);
    }
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
    return (
      this.allData.hero.onboarding.includes(key) ||
      Number(key) < this.getMaxOnboarding()
    );
  }

  getTargets() {
    return this.afterData.targets;
  }
}
