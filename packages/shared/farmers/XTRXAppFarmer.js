import { faker } from "@faker-js/faker";
import BaseDirectFarmer from "../lib/BaseDirectFarmer.js";

export default class XTRXAppFarmer extends BaseDirectFarmer {
  static id = "x-trx-app";
  static title = "X TRX App";
  static emoji = "🐂";
  static type = "direct";

  static telegramLink = "https://t.me/xtrxappbot?start=01834718320";

  static interval = "*/30 * * * *";
  static rating = 5;

  /* Enable Chances Limit */
  enableChancesLimit = true;

  /* Get Referral Link */
  getReferralLink() {
    return new Promise((resolve, reject) => {
      this.referralLinkPromise = { resolve, reject };
    });
  }

  /** Create Tools */
  createTools() {
    return [
      {
        id: "remove-chances-limit",
        title: "😊 Remove Chances Limit",
        action: this.removeChancesLimit.bind(this),
      },
    ];
  }

  /** Remove Chances Limit */
  removeChancesLimit() {
    this.enableChancesLimit = false;
    this.logger.success("😊 Chances limit removed for this session.");
  }

  /** Process Farmer */
  async process() {
    /** @type {import("telegram").Api.Message} */
    this.homeMessage = await this.startBot({
      filter: (message) => {
        this.debugger.log("Received message during startBot:", message);
        return message.buttonCount > 0;
      },
    });

    await this.executeTask("Subscribe to Channels", () =>
      this.subscribeToChannels()
    );
    await this.getUserInfo();
    await this.executeTask("Complete Tasks", () => this.completeTasks());
    await this.executeTask("Claim Bonus", () => this.claimBonus());
    await this.executeTask("Play Game", () => this.playGame());
    await this.executeTask("Participate in Airdrop", () =>
      this.participateInAirdrop()
    );
  }

  /**
   * Return to Home Menu
   * @param {import("telegram").Api.Message} message
   * @returns
   */
  async returnToHome(message) {
    /* Return to Home Menu */
    this.homeMessage = await this.clickButton(message, "🔙");
    this.debugger.log("Returned to Home menu:", this.homeMessage);

    return this.homeMessage;
  }

  async getUserInfo() {
    /* Click Account */
    let reply = await this.clickButton(this.homeMessage, "Account");
    this.debugger.log("Reply after clicking Account:", reply);

    /* Log the full message for debugging */
    const userInfoText = reply.message;
    this.debugger.log("User Info Text:", userInfoText);

    /* Extract user details from the message */
    const idMatch = userInfoText.match(/🆔ID:\s*(\d+)/);
    const trxBalanceMatch = userInfoText.match(/🦖TRX Balance:\s*([\d.]+)/);
    const gameBalanceMatch = userInfoText.match(/🎰Game Balance:\s*([\d.]+)/);
    const statusMatch = userInfoText.match(/⛏️Status:\s*(.+?)\s*—\s*(.+)/);
    const airdropStatusMatch = userInfoText.match(/🏆Airdrop Status:\s*(.+)/);
    const inviteLinkMatch = userInfoText.match(
      /🔗Invite:\s*(https:\/\/[^\s]+)/
    );
    const firstReferralMatch = userInfoText.match(
      /👁️First Referral Line:\s*(\d+)/
    );
    const secondReferralMatch = userInfoText.match(
      /👀Second Referral Line:\s*(\d+)/
    );

    /* Create user info object */
    const userInfo = {
      id: idMatch ? idMatch[1] : null,
      trxBalance: trxBalanceMatch ? parseFloat(trxBalanceMatch[1]) : 0,
      gameBalance: gameBalanceMatch ? parseFloat(gameBalanceMatch[1]) : 0,
      username: statusMatch ? statusMatch[1] : null,
      status: statusMatch ? statusMatch[2] : null,
      airdropStatus: airdropStatusMatch ? airdropStatusMatch[1] : null,
      inviteLink: inviteLinkMatch ? inviteLinkMatch[1] : null,
      firstReferralLine: firstReferralMatch
        ? parseInt(firstReferralMatch[1])
        : 0,
      secondReferralLine: secondReferralMatch
        ? parseInt(secondReferralMatch[1])
        : 0,
    };

    this.logger.newline();
    this.logger.info("User Info:");
    this.logger.keyValue("ID", userInfo.id);
    this.logger.keyValue("TRX Balance", userInfo.trxBalance);
    this.logger.keyValue("Game Balance", userInfo.gameBalance);
    this.logger.keyValue("Username", userInfo.username);
    this.logger.keyValue("Status", userInfo.status);
    this.logger.keyValue("Airdrop Status", userInfo.airdropStatus);
    this.logger.keyValue("Invite Link", userInfo.inviteLink);
    this.logger.keyValue("First Referral Line", userInfo.firstReferralLine);
    this.logger.keyValue("Second Referral Line", userInfo.secondReferralLine);

    /* Resolve referral link promise if it exists */
    if (this.referralLinkPromise && userInfo.inviteLink) {
      this.referralLinkPromise.resolve(userInfo.inviteLink);
    }

    /* Return to Home Menu */
    await this.returnToHome(reply);
  }

  async participateInAirdrop() {
    /* Click Airdrop */
    const airdropReply = await this.clickButton(this.homeMessage, "Airdrop");
    this.debugger.log("Reply after clicking Airdrop:", airdropReply);

    /* Click Participate */
    const participateReply = await this.clickButton(
      airdropReply,
      "I participate",
      {
        hasButtons: false,
      }
    );
    this.debugger.log("Reply after clicking Participate:", participateReply);

    if (participateReply.buttonCount > 0) {
      const confirmReply = await this.clickButton(participateReply, "Yes", {
        hasButtons: false,
      });
      this.debugger.log("Reply after clicking Confirm:", confirmReply);
      this.logger.success("✅ Participated in Airdrop!");
    } else {
      this.logger.log(participateReply.message);
    }

    /* Extract Current Airdrop Chances */
    const currentChanges = airdropReply.message.match(
      /🎟️Your additional chances of winning:\s*(\d+)/
    );
    const currentChances = currentChanges ? parseInt(currentChanges[1]) : 0;

    /* Log Airdrop Information */
    this.logger.newline();
    this.logger.info("Airdrop Information:");
    this.logger.keyValue("Current Airdrop Chances", currentChances);
    this.logger.newline();

    /* Increase Chances Multiple Times */
    let airdropPage = airdropReply;
    const total = this.enableChancesLimit
      ? Math.floor(Math.random() * 5) + 1
      : Infinity;
    this.debugger.log("Total iterations for Increase Chances:", total);

    for (let i = 0; i < total; i++) {
      if (this.signal.aborted) {
        this.logger.warn("Process aborted. Exiting Increase Chances loop.");
        break;
      }

      /* Click Increase Chances */
      const increaseChancesReply = await this.clickButton(
        airdropPage,
        "Increase chances"
      );

      this.debugger.log(
        "Reply after clicking Increase Chances:",
        increaseChancesReply
      );

      /* Generate Fake X Account Link */
      const username = faker.internet.username();
      const xAccount = `https://x.com/${username}`;
      this.debugger.log("Generated X Account URL:", xAccount);

      /* Send X Account Link */
      const enterLinkReply = await this.sendMessage(xAccount, undefined, {
        filter: (message) =>
          message.message.includes("You successfully invited 1 friend"),
      });
      this.debugger.log("Reply after sending X Account link:", enterLinkReply);

      this.logger.success(`✅ Increased Airdrop Chances!`);
      this.logger.keyValue("Link", xAccount);

      /* Delay for 1 Second */
      await this.utils.delayForSeconds(1);
    }

    /* Return to Home Menu */
    await this.returnToHome(airdropPage);
  }

  async subscribeToChannels() {
    const message = this.homeMessage;
    const buttons = message.buttons ? message.buttons.flat() : [];
    const checkButton = buttons.find((button) => button.text === "✅ Check");

    this.debugger.log("Message:", message);
    this.debugger.log("Buttons:", buttons);

    if (checkButton) {
      this.logger.info("Subscribing to channels...");
      this.debugger.log("Check button:", checkButton);

      const urls = buttons.map((button) => button.url).filter(Boolean);
      this.debugger.log("URLs:", urls);

      for (const url of urls) {
        await this.tryToJoinTelegramLink(url);
        this.logger.success(`✅ Subscribed: ${url}`);
      }

      const reply = await this.clickButton(message, "✅ Check");
      this.debugger.log("Reply after clicking Check:", reply);
      this.homeMessage = reply;
    }
  }

  async completeTasks() {
    /* Click Tasks */
    let reply = await this.clickButton(this.homeMessage, "Tasks");
    const buttons = reply.buttons
      .flat()
      .filter((button) => button.text.toLowerCase().includes("task"));

    this.debugger.log("Reply after clicking Tasks:", reply);
    this.debugger.log("Task Buttons:", buttons);

    for (const button of buttons) {
      /* Click Task Button */
      const taskReply = await this.clickButton(reply, button.text);
      this.debugger.log(`Reply after clicking ${button.text}:`, taskReply);

      /* Click Complete */
      const completeReply = await this.clickButton(taskReply, "Complete", {
        hasButtons: false,
      });

      this.debugger.log(`Reply after clicking Complete:`, completeReply);
      this.logger.success(`✅ Completed: ${button.text}`);

      /* Return to Tasks Menu */
      reply = await this.clickButton(taskReply, "🔙");
      this.debugger.log(`Returned to Tasks menu:`, reply);
    }

    /* Return to Home Menu */
    await this.returnToHome(reply);
  }

  async claimBonus() {
    this.logger.info("Claiming bonus...");
    /* Click Bonus */
    const reply = await this.clickButton(this.homeMessage, "Bonus", {
      hasButtons: false,
    });

    this.debugger.log("Reply after clicking Bonus:", reply);
    this.logger.log(reply.message);
  }

  async playGame() {
    /* Click Game */
    const gameReply = await this.clickButton(this.homeMessage, "Game");
    this.debugger.log("Reply after clicking Game:", gameReply);

    /* Click Slot */
    const slotReply = await this.clickButton(gameReply, "Slot");
    this.debugger.log("Reply after clicking Slot Game:", slotReply);

    /* Click Play */
    const playReply = await this.clickButton(slotReply, "Play", {
      hasButtons: false,
    });
    this.debugger.log("Reply after clicking Play:", playReply);

    if (playReply.buttonCount > 0) {
      /* Click Spin */
      const spinReply = await this.clickButton(playReply, "🎰");
      this.debugger.log("Reply after clicking Spin:", spinReply);
      this.logger.success("🎰 Slot game played!");
    } else {
      this.logger.info(playReply.message);
    }

    /* Return to Home Menu */
    await this.returnToHome(gameReply);
  }
}
