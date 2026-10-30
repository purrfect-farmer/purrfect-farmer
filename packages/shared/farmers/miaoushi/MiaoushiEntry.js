import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  AIRDROP_START_PARAM,
  BOT_BUTTONS,
  BOT_STEPS,
  MAX_ENTRY_STEPS,
} from "./constants.js";

/** The bot's entry flow: chats, wallet, X, screenshot and submit */
export default class MiaoushiEntry extends FarmerModule {
  get bot() {
    return this.ctx.bot;
  }

  /** Whether the bot message shows a submitted entry */
  isEntered(message) {
    return (
      message.message.includes(BOT_STEPS.ENTERED) ||
      message.message.includes(BOT_STEPS.SUBMITTED)
    );
  }

  /** Answer one bot step, returning the bot's next message */
  async answer(message) {
    const { bot, ctx } = this;
    const text = message.message;

    if (bot.findButton(message, BOT_BUTTONS.JOINED)) {
      await ctx.chats.ensureJoined();
      return bot.press(message, BOT_BUTTONS.JOINED);
    }

    if (text.includes(BOT_STEPS.WALLET)) {
      return bot.send(await ctx.identity.address());
    }

    if (text.includes(BOT_STEPS.X_USERNAME)) {
      return bot.send(`@${await ctx.identity.xUsername()}`);
    }

    if (text.includes(BOT_STEPS.QUOTE)) {
      return bot.send(await ctx.identity.quoteLink());
    }

    if (bot.findButton(message, BOT_BUTTONS.SKIP)) {
      return bot.press(message, BOT_BUTTONS.SKIP);
    }

    if (bot.findButton(message, BOT_BUTTONS.SUBMIT)) {
      return bot.press(message, BOT_BUTTONS.SUBMIT);
    }

    return null;
  }

  /** Walk the bot from its current step until the entry is submitted */
  async enter() {
    let message = await this.bot.start(AIRDROP_START_PARAM);

    for (let step = 0; step < MAX_ENTRY_STEPS; step++) {
      if (this.isEntered(message)) {
        this.logger.success(step ? "Entry submitted" : "Already entered");
        return true;
      }

      const next = await this.answer(message);

      if (!next) {
        this.logger.warn(`Unknown bot step: ${message.message}`);
        return false;
      }

      message = next;
    }

    this.logger.warn("The entry did not finish");
    return false;
  }
}
