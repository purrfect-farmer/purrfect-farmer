const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class WontonFarmer extends BaseFarmer {
  static id = "wonton";
  static origin = "https://www.wonton.restaurant";
  static delay = 5;
  static shouldSetAuth = true;

  async setAuth() {
    /** Get Access Token */
    const accessToken = await this.api
      .post("https://wonton.food/api/v1/user/auth", {
        initData: this.farmer.initData,
        inviteCode: "K45JQRG7",
        newUserPromoteCode: "",
      })
      .then((res) => res.data.tokens.accessToken);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("bearer " + accessToken);
  }
  async process() {
    await this.checkIn();
    await this.startOrClaimFarming();
    await this.completeTasks();
    await this.claimBadges();
    await this.playGame();
  }

  /** Daily Check-In */
  async checkIn() {
    await this.api.get("https://wonton.food/api/v1/checkin");
  }

  /** Start or Claim Farming */
  async startOrClaimFarming() {
    const farming = await this.api
      .get("https://wonton.food/api/v1/user/farming-status")
      .then((res) => res.data);

    const shouldStartFarming = !farming.finishAt || farming.claimed;

    if (shouldStartFarming) {
      await this.api.post("https://wonton.food/api/v1/user/start-farming");
    } else if (utils.dateFns.isAfter(new Date(), new Date(farming.finishAt))) {
      await this.api.post("https://wonton.food/api/v1/user/farming-claim");
      await this.api.post("https://wonton.food/api/v1/user/start-farming");
    }
  }

  /** Use Top Shop item */
  async useTopShopItem() {
    const { shopItems } = await this.api
      .get("https://wonton.food/api/v1/shop/list")
      .then((res) => res.data);

    const items = shopItems.filter((item) => item.inventory > 0);
    const skins = items.filter((item) => Number(item.farmingPower) !== 0);
    const bowls = items.filter((item) => Number(item.farmingPower) === 0);

    /** Top Skin */
    const topSkin =
      skins.length > 0
        ? skins.reduce((result, current) => {
            return Math.max(...current.stats.map(Number)) >
              Math.max(...result.stats.map(Number))
              ? current
              : result;
          }, skins[0])
        : null;

    /** Top Bowl */
    const topBowl =
      bowls.length > 0
        ? bowls.reduce((result, current) => {
            return Number(current.value) > Number(result.value)
              ? current
              : result;
          }, bowls[0])
        : null;

    let selectedSkin = skins.find((item) => item.inUse);
    let selectedBowl = bowls.find((item) => item.bowlDisplay);

    if (topSkin && topSkin.id !== selectedSkin?.id) {
      await this.useShopItem(topSkin.id);

      /** Set to Top Skin */
      selectedSkin = topSkin;
    }

    if (topBowl && topBowl.id !== selectedBowl?.id) {
      await this.useShopItem(topBowl.id);

      /** Set to Top Bowl */
      selectedBowl = topBowl;
    }

    return { selectedSkin, selectedBowl };
  }

  /** Use Shop Item */
  async useShopItem(itemId) {
    return this.api
      .post("https://wonton.food/api/v1/shop/use-item", { itemId })
      .then((res) => res.data);
  }

  /** Complete Tasks */
  async completeTasks() {
    const { tasks, taskProgress } = await this.api
      .get("https://wonton.food/api/v1/task/list")
      .then((res) => res.data);

    /** Pending Tasks */
    const pendingTasks = tasks.filter((item) => item.status === 0);

    /** Unclaimed Tasks */
    const unclaimedTasks = tasks.filter((item) => item.status === 1);

    /** Verify Task */
    if (pendingTasks.length > 0) {
      const task = utils.randomItem(pendingTasks);
      await this.api.post("https://wonton.food/api/v1/task/verify", {
        taskId: task.id,
      });
    }

    /** Claim Task */
    if (unclaimedTasks.length > 0) {
      const task = utils.randomItem(unclaimedTasks);
      await this.api.post("https://wonton.food/api/v1/task/claim", {
        taskId: task.id,
      });
    }

    /** Claim Progress */
    if (taskProgress >= 3) {
      await this.api.get("https://wonton.food/api/v1/task/claim-progress");
    }
  }

  /** Claim Badges */
  async claimBadges() {
    const list = await this.api
      .get("https://wonton.food/api/v1/badge/list")
      .then((res) => res.data);

    const badges = Object.values(list.badges);
    const unclaimedBadges = badges.filter(
      (item) => Number(item.progress) >= Number(item.target)
    );

    if (unclaimedBadges.length > 0) {
      const badge = utils.randomItem(unclaimedBadges);

      await this.api.post("https://wonton.food/api/v1/badge/claim", {
        type: badge.type,
      });
    }
  }

  /** Play Game */
  async playGame() {
    const { selectedSkin } = await this.useTopShopItem();
    const user = await this.api
      .get("https://wonton.food/api/v1/user")
      .then((res) => res.data);

    const tickets = user.ticketCount;

    if (tickets > 0) {
      const perItem = Math.max(...selectedSkin.stats.map(Number));
      const points = utils.extraGamePoints(70) * perItem;
      const { bonusRound } = await this.api
        .post("https://wonton.food/api/v1/user/start-game")
        .then((res) => res.data);

      await utils.delayForSeconds(15);
      await this.api.post("https://wonton.food/api/v1/user/finish-game", {
        points,
        hasBonus: bonusRound,
      });
    }
  }
};
