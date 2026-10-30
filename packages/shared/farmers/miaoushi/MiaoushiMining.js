import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  BOT_BUTTONS,
  BOT_USERNAME,
  MINE_START_PARAM,
  MINING_WAIT_MINUTES,
  MINING_WALLET_TEXT,
  NOT_MINING_TEXT,
} from "./constants.js";

/** Read a number from the dashboard line the pattern matches */
function readNumber(text, pattern) {
  const value = text.match(pattern)?.[1];
  return value ? Number(value.replaceAll(",", "")) : null;
}

/** The bot's mining sessions, started from its `/mine` dashboard */
export default class MiaoushiMining extends FarmerModule {
  /** The last dashboard's figures */
  info = null;

  get bot() {
    return this.ctx.bot;
  }

  /** The figures the dashboard message shows */
  parse(message) {
    const text = message.message;
    const left = text.match(/Mining · (\d+)h (\d+)m left/);

    return {
      mining: !text.includes(NOT_MINING_TEXT),
      minutesLeft: left ? Number(left[1]) * 60 + Number(left[2]) : null,
      balance: readNumber(text, /Balance: ([\d.,]+)/),
      rate: readNumber(text, /Rate: ([\d.,]+)\/hour/),
      streak: readNumber(text, /Streak: (\d+) day/),
      withdrawable: readNumber(text, /Available to withdraw: ([\d.,]+)/),
      referrals: readNumber(text, /Referrals: (\d+) invited/),
      inviteParam: text.match(/\?start=(mine_\w+)/)?.[1] ?? null,
    };
  }

  /** Log the dashboard's figures */
  logInfo(info) {
    this.logger.keyValue("Mining Balance", info.balance);
    this.logger.keyValue("Rate", `${info.rate}/hour`);
    this.logger.keyValue("Streak", `${info.streak} day(s)`);
    this.logger.keyValue("Withdrawable", `${info.withdrawable} MIAO`);
    this.logger.keyValue(
      "Session",
      info.mining ? `${info.minutesLeft ?? "?"}m left` : "stopped",
    );
  }

  /** Open the mining dashboard through the farmer's start param */
  async open() {
    const message = await this.bot.start(
      this.core.startParam || MINE_START_PARAM,
    );

    this.info = this.parse(message);
    return { message, info: this.info };
  }

  /** Open the dashboard once per run */
  async ensureOpened() {
    return this.info ?? (await this.open()).info;
  }

  /** The mining invite link, or null when the dashboard shows none */
  async getReferralLink() {
    const { inviteParam } = await this.ensureOpened();
    return inviteParam
      ? `https://t.me/${BOT_USERNAME}?start=${inviteParam}`
      : null;
  }

  /** The number of friends the mining invite brought */
  async getReferralsCount() {
    const { referrals } = await this.ensureOpened();
    return referrals ?? 0;
  }

  /** Press Start mining, giving the bot the wallet when it asks for one */
  async start(message) {
    let reply = await this.bot.press(message, BOT_BUTTONS.START_MINING);

    if (reply.message.includes(MINING_WALLET_TEXT)) {
      reply = await this.bot.send(await this.ctx.identity.address());
      reply = await this.bot.press(reply, BOT_BUTTONS.START_MINING);
    }

    return reply;
  }

  /** Start a session when none runs, waiting out one that is about to end */
  async mine() {
    await this.ctx.chats.ensureJoined();

    let { message, info } = await this.open();

    const endsSoon =
      info.mining &&
      info.minutesLeft !== null &&
      info.minutesLeft <= MINING_WAIT_MINUTES;

    if (endsSoon) {
      this.logger.log(`Session ends in ${info.minutesLeft}m, waiting`);
      await this.utils.delayForMinutes(info.minutesLeft + 1, {
        signal: this.signal,
      });
      ({ message, info } = await this.open());
    }

    if (info.mining) {
      this.logInfo(info);
      return;
    }

    message = await this.start(message);
    info = this.info = this.parse(message);

    if (info.mining) {
      this.logger.success("Mining started");
    } else {
      this.logger.warn("Mining did not start");
    }

    this.logInfo(info);
  }
}
