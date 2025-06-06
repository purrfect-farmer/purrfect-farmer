const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class DreamcoinFarmer extends BaseFarmer {
  static id = "dreamcoin";
  static origin = "https://dreamcoin.ai";
  static delay = 2;

  async setAuth() {
    const initData = this.farmer.initData;
    const initDataUnsafe = this.farmer.initDataUnsafe;

    /** Get Access Token */
    const accessToken = await this.api
      .post("https://api.dreamcoin.ai/Auth/telegram", {
        ["raw_init_data"]: initData,
        ["auth_date"]: initDataUnsafe["auth_date"],
        ["hash"]: initDataUnsafe["hash"],
        ["id"]: initDataUnsafe["user"]["id"],
        ["first_name"]: initDataUnsafe["user"]?.["first_name"] ?? "",
        ["last_name"]: initDataUnsafe["user"]?.["last_name"] ?? "",
        ["username"]: initDataUnsafe["user"]?.["username"] ?? "",
        ["photo_url"]: initDataUnsafe["user"]?.["photo_url"] ?? "",
      })
      .then((res) => res.data.token);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    await this.checkIn();
    await this.claimFreeRewards();

    const user = await this.api
      .get("https://api.dreamcoin.ai/Users/current")
      .then((res) => res.data);

    await this.claimClickerRewards(user);
    await this.spinLottery(user);
  }

  /** Claim Clicker Rewards */
  async claimClickerRewards(user) {
    const balance = user.balance;
    const freeCaseId = user.freeCaseId;

    /** Open Free Case */
    if (freeCaseId) {
      await this.openFreeCase(freeCaseId);
    }

    /** Claim Clicker */
    const currentClicks = user.clickerLevel.currentClicks;
    if (currentClicks > 0) {
      await this.api.post("https://api.dreamcoin.ai/Clicker/collect-reward", {
        amount: currentClicks,
      });
    }

    /** Upgrade Level */
    const upgradePrice = user.clickerLevel.upgradePrice;
    if (balance >= upgradePrice) {
      await this.api.post("https://api.dreamcoin.ai/Clicker/upgrade");
    }
  }

  /** Spin Lottery */
  async spinLottery(user) {
    let energy = Number(user.energy.current);
    const sortedMultipliers = user.availableSpinMultipliers.sort(
      (a, b) => b - a
    );

    while (energy > 0) {
      /** Available Multipliers */
      const availableMultipliers = sortedMultipliers.filter(
        (item) => item <= energy
      );

      /** Selected Multiplier */
      const multiplier = availableMultipliers[0] || 1;

      /** Deduct Energy */
      energy -= multiplier;

      /** Get Slot Rewards */
      const slotRewards = await this.api
        .post("https://api.dreamcoin.ai/Slot/spin", { multiplier })
        .then((res) => res.data.slotRewards);

      /** Claim Rewards */
      for (const reward of slotRewards) {
        switch (reward.rewardType) {
          case "FreeCase":
            await this.openFreeCase(reward.freeCase);
            break;
          case "Raid":
            await this.api.post("https://api.dreamcoin.ai/Raids/claim", {
              RewardNumber: 1 + Math.floor(Math.random() * 4),
            });
            break;
        }
      }
    }
  }

  /** Open Free Case */
  async openFreeCase(freeCaseId) {
    await this.api.get(`https://api.dreamcoin.ai/Cases/${freeCaseId}`);
    await this.api.post(`https://api.dreamcoin.ai/Cases/${freeCaseId}/open`);
  }

  /** Claim Free Rewards */
  async claimFreeRewards() {
    const rewardsList = await this.api
      .get("https://api.dreamcoin.ai/FreeReward/current")
      .then((res) => res.data);

    const rewards = Object.entries(rewardsList).reduce(
      (result, [taskGroup, tasks]) =>
        result.concat(
          tasks
            .filter((item) => this.validateTelegramTask(item.actionUrl))
            .map((item) => ({ ...item, taskGroup }))
        ),
      []
    );

    const uncompletedRewards = rewards.filter((item) => !item.isCompleted);
    const reward = utils.randomItem(uncompletedRewards);

    if (reward) {
      await this.tryToJoinTelegramLink(reward.actionUrl);
      if (reward.taskGroup === "dailyFreeRewards") {
        await this.api.post(
          `https://api.dreamcoin.ai/FreeReward/claimDaily/${reward.id}`
        );
      } else {
        await this.api.post(
          `https://api.dreamcoin.ai/FreeReward/claim/${reward.id}`
        );
      }
    }
  }

  /** Check-In */
  async checkIn() {
    const today = new Date().toISOString().split("T")[0];
    const dailyTasks = await this.api
      .get("https://api.dreamcoin.ai/DailyTasks/current")
      .then((res) => res.data.dailyTasks);
    const day = dailyTasks.find(
      (item) => item.date === today && !item.isClaimed
    );

    if (day) {
      await this.api.post(
        `https://api.dreamcoin.ai/DailyTasks/claim/${day.id}`
      );
    }
  }
};
