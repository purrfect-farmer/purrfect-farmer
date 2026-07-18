import BaseFarmer from "../lib/BaseFarmer.js";

const ENCRYPTION_KEY = "Q/q=Blgu6[(Uf%cu";
const API_HEADERS = { "content-type": "application/x-www-form-urlencoded" };

export default class SurfEarnFarmer extends BaseFarmer {
  static id = "surf-earn";
  static title = "Surf Earn";
  static emoji = "🪙";
  static host = "surf-earn.top";
  static domains = ["surf-earn.top"];
  static rating = 5;
  static cookies = true;
  static cacheAuth = false;
  static telegramLink = "https://t.me/surf_earn_bot/app?startapp=r_1147265290";

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/surf_earn_bot/app?startapp=r_${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return this.api.postForm(
      "https://surf-earn.top/authorization",
      {
        initData: this.getInitData(),
        tgUplineId: this.getStartParam(),
      },
      { headers: API_HEADERS },
    );
  }

  /** Get Cookies for Sync */
  async getCookiesForSync() {
    return [
      {
        url: "https://surf-earn.top",
        cookies: await this.getCookies({
          url: "https://surf-earn.top",
        }),
      },
    ];
  }

  async getEarnings() {
    return this.api
      .postForm("https://surf-earn.top/load/earnings")
      .then((res) => res.data);
  }

  async getFriends() {
    return this.api
      .postForm("https://surf-earn.top/load/friends")
      .then((res) => res.data);
  }

  async claimPendingFriendsIncome() {
    return this.api
      .postForm("https://surf-earn.top/friends/claimPendingFriendsIncome")
      .then((res) => res.data);
  }

  async startTask(category, data) {
    return this.api
      .postForm(
        `https://surf-earn.top/tasks/start${this.capitalizeFirstLetter(category)}Task`,
        data,
        { headers: API_HEADERS },
      )
      .then((res) => res.data);
  }

  async claimTaskReward(category, data) {
    return this.api
      .postForm(
        `https://surf-earn.top/tasks/claim${this.capitalizeFirstLetter(category)}TaskReward`,
        data,
        { headers: API_HEADERS },
      )
      .then((res) => res.data);
  }

  async sendVerificationCode() {
    // {"show_modal":true}
    return this.api
      .postForm("https://surf-earn.top/protection/sendVerificationCode")
      .then((res) => res.data);
  }

  async applyVerificationCode(code) {
    return this.api
      .postForm(
        "https://surf-earn.top/protection/applyVerificationCode",
        { code },
        { headers: API_HEADERS },
      )
      .then((res) => res.data);
  }

  capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async getPHPSessionId() {
    const cookies = await this.getCookies({
      url: "https://surf-earn.top",
    });

    const phpSessionIdCookie = cookies.find(
      (item) => item.name.toUpperCase() === "PHPSESSID",
    );

    this.phpSessionId = phpSessionIdCookie.value;

    return this.phpSessionId;
  }

  async generatePayload(validationHash) {
    const phpSessionId = await this.getPHPSessionId();
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = this.generateNonce();

    return [validationHash, phpSessionId, timestamp, nonce].join(":");
  }

  generateNonce(nonceLength = 32) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < nonceLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async signPayload(payload) {
    return this.utils.sha256Hmac(ENCRYPTION_KEY, payload);
  }

  async getSignature(validationHash) {
    if (!validationHash) return;
    const payload = await this.generatePayload(validationHash);
    const signature = await this.signPayload(payload);

    return {
      payload,
      signature,
    };
  }

  /** Process Farmer */
  async process() {
    /* Daily Tasks */
    await this.executeTask("Friends Reward", () => this.collectFriendsReward());
    await this.executeTask("Tasks", () => this.completeTasks());
  }

  async extractEarnings(earningsHtml) {
    const dom = await this.utils.parseHTML(earningsHtml);

    const categories = ["daily", "promo", "youtube", "game"];
    const taskNodes = dom.querySelectorAll(`[class^="item_task_"]`);
    const tasks = [];

    taskNodes.forEach((node) => {
      const titleNode = node.querySelector(`[class^="task_title_"]`);
      const rewardNode = node.querySelector(`[class^="task_reward_"] p`);
      const countNode = node.querySelector(`[class^="count_"] p`);
      const actionButtonNode = node.querySelector(
        `[class^="task_action_"] button`,
      );

      const [category, id] = node.getAttribute("id").split("Task_");
      const taskId = actionButtonNode?.getAttribute?.("data-id");
      const title = titleNode.textContent.trim();
      const reward = parseFloat(
        rewardNode.textContent.trim().replaceAll(/[^\d]+/g, ""),
      );
      const count = countNode
        ? countNode.textContent.trim().split("/").map(parseFloat)
        : null;

      if (taskId) {
        tasks.push({
          category,
          id,
          taskId,
          title,
          count,
          reward,
        });
      }
    });

    return { tasks };
  }

  async extractFriendsData(friendsHtml) {
    const dom = await this.utils.parseHTML(friendsHtml);
    const pendingCoinsNode = dom.getElementById("pending_friends_coins");

    const pendingCoins = parseFloat(
      pendingCoinsNode.textContent.trim().replaceAll(/[^\d]+/g, ""),
    );

    return { pendingCoins };
  }

  async completeVerificationCode() {
    const verificationCodeStatus = await this.sendVerificationCode();

    if (verificationCodeStatus["show_modal"]) {
      this.logger.info("Getting verification code.");
      if (!this.client) {
        throw new Error(
          "No telegram client has been configured for this account!",
        );
      } else {
        let code = null;

        while (!code) {
          if (this.signal.aborted) return;
          const entity = "surf_earn_bot";
          let messages = await this.client.getMessages(entity);

          if (!messages.length) {
            await this.client.sendMessage(entity, { message: "/start" });
            await this.utils.delayForSeconds(10);
            messages = await this.client.getMessages(entity);
          }

          this.debugger.log("Messages from bot:", messages);

          const regex = /verification code is ([\d]+)/;
          const messageWithCode = messages.find((msg) =>
            msg.message.match(regex),
          );

          this.debugger.log("Message with code:", messageWithCode);

          if (messageWithCode) {
            code = messageWithCode.message.match(regex)[1];
          } else {
            await this.utils.delayForSeconds(10);
          }
        }

        this.logger.info(`Applying verification code: ${code}`);
        await this.applyVerificationCode(code);
      }
    }
  }

  async completeTasks() {
    const earningsHtml = await this.getEarnings();
    const { tasks } = await this.extractEarnings(earningsHtml);

    this.debugger.log("All tasks:", tasks);

    for (const item of tasks) {
      if (this.signal.aborted) return;

      this.debugger.log("Current task:", item);
      this.logger.info(
        `Attempting task: (${this.capitalizeFirstLetter(item.category)}) ${item.title}`,
      );

      let info, link, verificationHash;
      let progress = item.count?.[0] ?? 0;
      let total = item.count?.[1] ?? 1;

      while (progress < total) {
        info = await this.startTask(item.category, {
          id: item.id,
        });

        this.debugger.log("Task info:", info);

        verificationHash = info["validation_hash"];
        link = info["link"];

        if (link) {
          await this.tryToJoinTelegramLink(link);
        }

        await this.utils.delayForSeconds(20);
        await this.completeVerificationCode();

        if (item.count) {
          const result = await this.startTask(item.category, {
            id: item.id,
            data: await this.getSignature(verificationHash),
          });

          this.debugger.log("Task result:", result);
        }

        progress++;

        await this.utils.delayForSeconds(5);
      }

      const result = await this.claimTaskReward(item.category, {
        id: item.id,
        data: await this.getSignature(verificationHash),
      });

      this.debugger.log("Task result:", result);

      if (result.icon === "success") {
        this.logger.success(`Claimed task: ${item.reward} - ${result.coins}`);
      }

      await this.utils.delayForSeconds(5);
    }
  }

  async collectFriendsReward() {
    const friendsHtml = await this.getFriends();
    const { pendingCoins } = await this.extractFriendsData(friendsHtml);

    if (pendingCoins > 0) {
      this.logger.keyValue("Pending coins", pendingCoins);
      await this.claimPendingFriendsIncome();
      this.logger.success("Claimed friends reward!");
    }
  }
}
