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

  finishOnboarding(level) {
    return this.api
      .post("https://api.fomofighters.xyz/onboarding/finish", Number(level))
      .then((res) => res.data.data);
  }

  getAttackInfo() {
    return this.api
      .post("https://api.fomofighters.xyz/attack/info", {})
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

  createAttach(target, troops) {
    return this.api
      .post("https://api.fomofighters.xyz/attack/create", {
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
      allData,
      afterData,
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
      const race = this.utils.randomItem(["dog", "frog", "cat"]);
      const result = await this.selectRace(race);
      this.allData = { ...this.allData, ...result };
      this.logger.success(`Selected race: ${race}`);
    }

    /** Complete onboarding */
    for (const onboarding of this.allData.dbData.dbOnboarding) {
      /** Skip completed */
      if (this.hasCompletedOnboarding(onboarding.key)) {
        continue;
      }

      /** Compare hero level */
      if (
        this.allData.hero.level < item.minHeroLevel ||
        this.allData.hero.level > item.maxHeroLevel
      ) {
        return;
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
        const result = await this.claimResource("food");
        this.allData = { ...this.allData, ...result };
        this.logger.success(`Claimed resource: FOOD`);
      }

      /** Claim quest */
      if (checkType === "claimQuestStoryMain" || checkType === "claimQuests") {
        const claimed = await this.completeMainQuest();
        if (!claimed) return;
      }

      /** Train troops */
      if (checkType === "trainBuilding") {
        const trained = await this.trainTroops(onboarding.data);
        if (!trained) return;
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
    /** Find castle */
    const castle = this.getCastle();

    /** Find building in dbData */
    const building = this.findGameBuilding("castle");

    /** Check if building can be purchased */
    const canPurchase = this.checkBuildingRequirements(
      building,
      castle.level + 1,
    );

    if (!canPurchase) return false;

    /** Purchase building */
    const result = await this.purchaseLand(castle.position, castle.key);

    /** Log success */
    this.logger.success(`Purchased building: ${building.title}`);

    /** Update data */
    this.allData = { ...this.allData, ...result };

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
      const owned = this.getOwnedBuildings().find((b) => b.key === key);
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

  async checkBuildings(data) {
    for (const [key, level] of Object.entries(data)) {
      /** Find building in dbData */
      const building = this.findGameBuilding(key);

      /** Get owned building */
      let owned = this.findOwnedBuilding(building.key);

      while (!owned || owned.level < level) {
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
        owned = this.findOwnedBuilding(building.key);
      }
    }

    return true;
  }

  /** Train troops
   * @param {Record<string, number>} data
   */
  async trainTroops(data) {
    for (const [key, count] of Object.entries(data)) {
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
    }

    return true;
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
