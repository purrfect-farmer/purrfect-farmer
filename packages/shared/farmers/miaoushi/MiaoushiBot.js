import { Api } from "telegram";

import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { BOT_USERNAME } from "./constants.js";

/** Seconds between checks for the bot's reply */
const POLL_SECONDS = 1;

/** Seconds to wait for the bot's first reply */
const REPLY_TIMEOUT_SECONDS = 20;

/** Seconds without a new message before a reply counts as complete */
const SETTLE_SECONDS = 3;

/** Decoder for the bytes a callback button carries */
const decoder = new TextDecoder();

/** The chat with the airdrop bot, read by polling its history */
export default class MiaoushiBot extends FarmerModule {
  /** @type {import("telegram").TelegramClient} */
  get client() {
    return this.core.client;
  }

  /** Run an action, then return the bot's last message once it stops replying */
  async act(action) {
    const [newest] = await this.client.getMessages(BOT_USERNAME, { limit: 1 });
    const minId = newest?.id ?? 0;

    const result = await action();

    let reply = null;
    let waited = 0;
    let quiet = 0;

    while (waited < REPLY_TIMEOUT_SECONDS && quiet < SETTLE_SECONDS) {
      await this.utils.delayForSeconds(POLL_SECONDS, { signal: this.signal });
      waited += POLL_SECONDS;

      const messages = await this.client.getMessages(BOT_USERNAME, {
        minId,
        limit: 10,
      });
      const last = messages.find((message) => !message.out);

      if (last && last.id !== reply?.id) {
        reply = last;
        quiet = 0;
      } else if (reply) {
        quiet += POLL_SECONDS;
      }
    }

    if (!reply) {
      throw new Error(result?.message || "The bot did not reply");
    }

    return reply;
  }

  /** Open the bot with a start param */
  start(startParam) {
    return this.act(() =>
      this.client.invoke(
        new Api.messages.StartBot({
          bot: BOT_USERNAME,
          peer: BOT_USERNAME,
          startParam,
        }),
      ),
    );
  }

  /** Send a text message */
  send(message) {
    return this.act(() => this.client.sendMessage(BOT_USERNAME, { message }));
  }

  /** The message's callback button with this data, if it has one */
  findButton(message, data) {
    const buttons = message?.replyMarkup?.rows?.flatMap((row) => row.buttons);

    return buttons?.find(
      (button) => button.data && decoder.decode(button.data) === data,
    );
  }

  /** Press the message's callback button with this data */
  press(message, data) {
    const button = this.findButton(message, data);

    if (!button) throw new Error(`The bot message has no ${data} button`);

    return this.act(() => message.click({ data: button.data }));
  }
}
