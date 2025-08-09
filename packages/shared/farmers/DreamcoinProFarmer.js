import BaseFarmer from "../lib/BaseFarmer.js";

export default class DreamcoinProFarmer extends BaseFarmer {
  static id = "dreamcoin-pro";
  static title = "Dreamcoin Pro";
  static emoji = "👛";
  static host = "app.dreamcoin.pro";
  static domains = ["app.dreamcoin.pro", "api.dreamcoin.pro"];
  static telegramLink = "https://t.me/dreamcoin_bot?start=r_1147265290";
  static cacheAuth = false;

  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      config.url = this.updateUrl(config.url);

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  updateUrl(url) {
    return `${url}?${new URLSearchParams({
      initData: this.telegramWebApp.initData,
    }).toString()}`;
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/dreamcoin_bot?start=r_${this.getUserId()}`;
  }

  getDailyBonus(signal = this.signal) {
    return this.api
      .get("https://api.dreamcoin.pro/api/tasks-groups/7", { signal })
      .then((res) => res.data);
  }

  login(signal = this.signal) {
    return this.api
      .post(
        `https://api.dreamcoin.pro/api/users/login/${
          this.getStartParam() || null
        }`,
        {
          ["user_agent"]: this.userAgent,
        },
        { signal }
      )
      .then((res) => res.data);
  }

  getBalance(signal = this.signal) {
    return this.api
      .get("https://api.dreamcoin.pro/api/users/balance/", { signal })
      .then((res) => res.data);
  }

  getCharacters(signal = this.signal) {
    return this.api
      .get("https://api.dreamcoin.pro/api/characters", { signal })
      .then((res) => res.data);
  }

  getMining(signal = this.signal) {
    return this.api
      .get("https://api.dreamcoin.pro/api/mining", { signal })
      .then((res) => res.data);
  }

  buyCharacter(id, signal = this.signal) {
    return this.api.post(
      `https://api.dreamcoin.pro/api/characters/${id}`,
      null,
      { signal }
    );
  }

  setCharacter(id, signal = this.signal) {
    return this.api.patch(
      `https://api.dreamcoin.pro/api/characters/${id}`,
      null,
      { signal }
    );
  }

  async process() {
    const dailyBonus = await this.getDailyBonus();
    const login = await this.login();
    const balance = await this.getBalance();
    const characters = await this.getCharacters();
    const mining = await this.getMining();

    this.logUserInfo(balance, characters, mining);

    await this.visitPage("/");
    await this.checkIn(dailyBonus);
    await this.spinRaffle(balance);
    await this.claimReferralBonus();
    await this.purchaseCharacters(balance, characters);
    await this.completeMining(mining);
    await this.completeTasks();
  }

  logUserInfo(balance, characters, mining) {
    const activeCharacter = characters["owned_characters"].find(
      (item) => item["is_active"]
    )?.character;

    this.logger.newline();
    this.logger.info(`User: ${this.getUsername()} (${this.getUserId()})`);
    this.logger.info(`Balance: DC ${balance.dc}, USDT ${balance.usdt}`);
    this.logger.info(`Characters: ${characters["owned_characters"].length}`);
    this.logger.info(`Active: ${activeCharacter?.name || "None"}`);
    this.logger.info(`Mining: ${mining.mining.status}`);
    this.logger.info(`Last Boost: ${mining.last_boost_time || "Never"}`);
    this.logger.newline();
  }

  getRefSystem(signal = this.signal) {
    return this.api
      .get(`https://api.dreamcoin.pro/api/ref_system/${this.getUserId()}`, {
        signal,
      })
      .then((res) => res.data.data);
  }

  getUsdtRefSystem(signal = this.signal) {
    return this.api
      .get(`https://api.dreamcoin.pro/api/usdt_ref/${this.getUserId()}`, {
        signal,
      })
      .then((res) => res.data.data);
  }

  claimRefSystem(signal = this.signal) {
    return this.api
      .post(`https://api.dreamcoin.pro/api/ref_claim/`, null, { signal })
      .then((res) => res.data.data);
  }

  claimUsdtRefSystem(signal = this.signal) {
    return this.api
      .post(`https://api.dreamcoin.pro/api/claim_usdt_ref/`, null, { signal })
      .then((res) => res.data.data);
  }

  async claimReferralBonus() {
    return this.executeTask("Claim Referral Bonus", async () => {
      await this.visitPage("/fortune-wheel");

      const refSystem = await this.getRefSystem();
      const usdtSystem = await this.getUsdtRefSystem();

      if (refSystem["amount_all"] > 0) {
        await this.claimRefSystem();
      }

      if (usdtSystem["amount_all"] > 0) {
        await this.claimUsdtRefSystem();
      }
    });
  }

  spin(signal = this.signal) {
    return this.api
      .post("https://api.dreamcoin.pro/api/spin", null, { signal })
      .then((res) => res.data.data);
  }

  async spinRaffle(balance) {
    return this.executeTask("Spin Raffle", async () => {
      await this.visitPage("/fortune-wheel");
      for (let i = 0; i < balance.tickets; i++) {
        await this.spin();
      }
    });
  }
  async purchaseCharacters(balance, characters) {
    return this.executeTask("Purchase Characters", async () => {
      const available = characters["available_characters"].filter(
        (item) => item["price_currency"] === "DC" && item["price"] <= balance.dc
      );

      const item = this.utils.randomItem(available);

      if (item) {
        await this.buyCharacter(item.id);
        await this.setCharacter(item.id);
      } else {
        this.setActiveCharacter(characters);
      }
    });
  }
  async setActiveCharacter(characters) {
    const owned = characters["owned_characters"];
    const top = owned.sort(
      (a, b) => b.character["earns_usdt"] - a.character["earns_usdt"]
    )[0];

    if (top && !top["is_active"]) {
      await this.setCharacter(top.character.id);
    }
  }

  getTaskGroups(signal = this.signal) {
    return this.api
      .get("https://api.dreamcoin.pro/api/tasks-groups", { signal })
      .then((res) => res.data);
  }

  getTaskGroupInfo(id, signal = this.signal) {
    return this.api
      .get(`https://api.dreamcoin.pro/api/tasks-groups/${id}`, { signal })
      .then((res) => res.data);
  }

  async completeTasks() {
    return this.executeTask("Complete Tasks", async () => {
      await this.visitPage("/earn");
      const tasksGroups = await this.getTaskGroups();

      const individualTasks = tasksGroups.individual;
      const combinedTasks = tasksGroups.combined;

      for (const group of individualTasks) {
        const groupInfo = await this.getTaskGroupInfo(group["task_group_id"]);

        if (group.slug === "partners") {
          await this.visitPage(`/tasks/${group.slug}`);

          const availableTasks = groupInfo.tasks.filter(
            (item) =>
              item.status === "NOT_STARTED" &&
              this.validateTelegramTask(item.partner?.link)
          );

          for (const task of availableTasks) {
            try {
              await this.tryToJoinTelegramLink(task.partner?.link);
              await this.claimTask(task.id);
            } catch (e) {
              this.logger.error(
                "Failed to Claim Task:",
                this.getUserId(),
                task,
                e.response?.data || e.message
              );
            }
          }
        } else if (group.slug === "quest-daily") {
          await this.visitPage(`/tasks/${group.slug}`);
          const availableTasks = groupInfo.tasks.filter(
            (item) => item.status === "DONE"
          );

          for (const task of availableTasks) {
            await this.claimTask(task.id);
          }
        }
      }
    });
  }

  async checkIn(groupInfo) {
    return this.executeTask("Check In", async () => {
      const day = groupInfo.tasks.find(
        (item) =>
          item.status === "NOT_STARTED" &&
          item.details["current_day"] &&
          this.validateTelegramTask(item.details["promote_link"])
      );

      if (day) {
        await this.tryToJoinTelegramLink(day.details["promote_link"]);
        await this.claimTask(day.id, {
          details: {
            validation_type: "subscription",
            partner_id: day.details["partner_id"],
          },
        });
      }
    });
  }

  async claimTask(id, payload) {
    await this.api.post(
      `https://api.dreamcoin.pro/api/tasks/${id}/claim`,
      payload
    );
  }

  startMining(signal = this.signal) {
    return this.api.post("https://api.dreamcoin.pro/api/mining", null, {
      signal,
    });
  }

  deleteMining(id, signal = this.signal) {
    return this.api.delete(`https://api.dreamcoin.pro/api/mining/${id}`, {
      signal,
    });
  }

  async completeMining(mining) {
    return this.executeTask("Complete Mining", async () => {
      if (mining.mining.status === "end") {
        await this.startMining();
      } else if (mining.mining.status === "claim") {
        await this.boostMining(mining, "claim");
        await this.deleteMining(mining.mining.id);
      } else if (
        mining["last_boost_time"] === null ||
        this.utils.dateFns.isBefore(
          new Date(mining["last_boost_time"] + "Z"),
          this.utils.dateFns.subMinutes(new Date(), 3)
        )
      ) {
        await this.boostMining(mining);
      }
    });
  }

  getCpcBanner(signal = this.signal) {
    return this.api
      .get("https://api.dreamcoin.pro/api/cpc/banner", { signal })
      .then((res) => res.data);
  }

  getWidget(payload, signal = this.signal) {
    return this.api
      .post("https://api.dreamcoin.pro/api/barza/original_widget", payload, {
        signal,
      })
      .then((res) => res.data);
  }

  getCampaignLink(campaignId, payload, signal = this.signal) {
    return this.api
      .post(
        `https://api.dreamcoin.pro/api/barza/original_widget/${campaignId}/link`,
        payload,
        { signal }
      )
      .then((res) => res.data);
  }

  boostWithProvider(id, provider, action, signal = this.signal) {
    return this.api.post(
      `https://api.dreamcoin.pro/api/mining/${id}/boost`,
      {
        action,
        provider,
      },
      { signal }
    );
  }

  async boostMining(mining, action) {
    this.logger.log(
      `Boosting mining with action: ${
        action || "default"
      } for account: ${this.getUsername()}`
    );

    try {
      await this.getCpcBanner();
    } catch (e) {
      this.logger.error("Failed to get banner!");
    }

    const payload = {
      tg_user_id: this.getUserId(),
      tg_user_locale: "ru",
      tg_user_first_name: this.getTelegramUser()?.["first_name"],
      tg_user_is_premium: false,
      tg_user_platform: "android",
    };
    const widget = await this.getWidget(payload);

    if (widget["ad_campaign_id"]) {
      const link = await this.getCampaignLink(
        widget["ad_campaign_id"],
        payload
      );
    }

    await this.boostWithProvider(
      mining.mining.id,
      widget["ad_campaign_id"] ? "barza" : "tads",
      action
    );
  }

  async visitPage(page = "/", signal = this.signal) {
    await this.logger.info(
      `Visiting page: ${page} for account: ${this.getUsername()}`
    );
    await this.utils.delayForSeconds(2);
    await this.api
      .post(
        "https://api.dreamcoin.pro/api/users/action",
        {
          ["events"]: [
            {
              timestamp: Math.floor(Date.now() / 1000),
              type: "page_view",
              value: page,
              userId: this.getUserId(),
            },
          ],
          ["app_version"]: "1.2.87",
        },
        { signal }
      )
      .then((res) => res.data);
  }
}
