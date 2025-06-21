const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class DiggerFarmer extends BaseFarmer {
  static id = "digger";
  static title = "🏴‍☠️ Digger Farmer";
  static origin = "https://diggergame.app";
  static delay = 2;
  static auth = true;

  static CHEST_TYPES = {
    7: "usdt_chest",
    3: "adamant_chest",
    2: "gold_chest",
  };

  async setAuth() {
    /** Get Access Token */
    const accessToken = await this.api
      .post("https://api.diggergame.app/api/auth", {
        ["init_data"]: this.farmer.initData,
        ["platform"]: "android",
      })
      .then((res) => res.data.result.auth.token);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    /** Dig */
    try {
      await this.api.post("https://api.diggergame.app/api/play/dig", {
        ["init_data"]: this.farmer.initData,
        ["platform"]: "android",
      });
    } catch (error) {
      console.error("Unable to dig:", error);
    }

    /** Complete Tasks */
    await this.completeTasks();

    /** User */
    const user = await this.api
      .get("https://api.diggergame.app/api/me")
      .then((res) => res.data.result);

    /** Upgrade Cards */
    await this.upgradeCards(user);

    /** Watch Chest Ads */
    await this.watchChestAds();

    /** Tap Chest */
    await this.tapChest();
  }

  async tapChest() {
    const chestList = await this.api
      .get("https://api.diggergame.app/api/user-chest/list")
      .then((res) => res.data.result);

    const chests = chestList
      .filter((item) => item.chest && item.status === "progress")
      .sort((a, b) => b.chest.id - a.chest.id);

    const currentChest = chests?.[0];
    const uid = currentChest?.uid;
    const maxCount = currentChest?.["open_tap_cnt"] || 0;
    const currentCount = currentChest?.["current_tap_cnt"] || 0;

    /** Initial Energy */
    let energy = maxCount - currentCount;

    /** Tap */
    while (energy > 0) {
      const taps = Math.min(energy, 10);

      /** Deduct Energry */
      energy -= taps;

      await this.api.post("https://api.diggergame.app/api/play/tap", {
        ["uid"]: uid,
        ["cnt"]: taps,
      });
    }
  }

  /** Watch Chest Ads */
  async watchChestAds() {
    const chestStatus = await this.api
      .get("https://api.diggergame.app/api/content/chest/status")
      .then((res) => res.data.result["chest_statuses"]);

    const viewableChests = chestStatus.filter(
      (item) =>
        item["chest_id"] in this.constructor.CHEST_TYPES &&
        item["remaining_cooldown_sec"] === 0 &&
        item["ads_watched"] < item["ads_required"]
    );

    if (viewableChests.length > 0) {
      const chest = utils.randomItem(viewableChests);

      for (let i = chest["ads_watched"]; i < chest["ads_required"]; i++) {
        await this.watchAd(this.constructor.CHEST_TYPES[chest["chest_id"]]);
      }
    }
  }

  async watchAd(type) {
    /** Get UID */
    const uid = await this.api
      .post("https://api.diggergame.app/api/content/intent", {
        platform: "2",
        type,
      })
      .then((res) => res.data.result.uid);

    /** Delay */
    await utils.delayForSeconds(30);

    /** Get reward */
    await this.api.post("https://api.diggergame.app/api/content/update", {
      status: "reward",
      uid,
    });
  }

  async upgradeCards(user) {
    /** Balance */
    const balance = user["coin_cnt"];

    /** Get Card */
    const cards = await this.api
      .get("https://api.diggergame.app/api/user/card/list")
      .then((res) => res.data.result);

    /** Upgradable Cards */
    const upgradableCards = cards.filter(
      (card) => card["next_level"] && card["next_level"]["price"] <= balance
    );

    /** Level Zero Cards */
    const levelZeroCards = upgradableCards.filter((item) => !item["cur_level"]);

    /** Choose Collection */
    const collection = levelZeroCards.length ? levelZeroCards : upgradableCards;

    /** Select Card */
    const card = utils.randomItem(collection);

    if (card) {
      await this.api.post("https://api.diggergame.app/api/user/card/buy", {
        ["card_id"]: card["card"]["id"],
      });
    }
  }

  async completeTasks() {
    const tasks = await this.api
      .get("https://api.diggergame.app/api/user-task/list")
      .then((res) => res.data.result);

    /** Pending Tasks */
    const pendingTasks = tasks.filter((item) => item.status === "progress");

    /** Unclaimed Tasks */
    const unclaimedTasks = tasks.filter(
      (item) => item.status === "waiting_reward"
    );

    /** Start Pending Task */
    if (pendingTasks.length > 0) {
      const task = utils.randomItem(pendingTasks);
      await this.api.post("https://api.diggergame.app/api/user-task/update", {
        type: task.type,
      });
    }

    /** Claim Task */
    if (unclaimedTasks.length > 0) {
      const task = utils.randomItem(unclaimedTasks);
      await this.api.post("https://api.diggergame.app/api/user-task/check", {
        type: task.type,
      });
    }
  }
};
