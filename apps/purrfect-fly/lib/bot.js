import { Bot } from "grammy";

import app from "../config/app.js";
import cache from "./cache.js";
import utils from "./utils.js";

class GroupBot extends Bot {
  /** Send Group Message */
  async sendGroupMessage(cacheKey, message, options = {}) {
    const previous = await cache.get(cacheKey);
    const sent = await this.api.sendMessage(app.chat.id, message.join("\n"), {
      ...options,
      ["parse_mode"]: "HTML",
      ["link_preview_options"]: { ["is_disabled"]: true },
    });

    /** Store Message ID */
    await cache.set(cacheKey, sent["message_id"]);

    /** Remove Previous Message */
    try {
      if (previous) {
        await this.api.deleteMessage(app.chat.id, previous);
      }
    } catch (error) {
      console.error(error);
    }

    return message;
  }

  /** Send Farming Initiated Message */
  async sendFarmingInitiatedMessage(result) {
    try {
      const users = utils.formatUsers(
        result.farmers.map((farmer) => {
          return {
            id: farmer.account.id,
            status: farmer.active ? "✅" : "❌",
            session: farmer.account.session ? "🟨" : "🟪",
            username: farmer.account.user?.username ?? "",
            title: farmer.account.title,
          };
        })
      );

      return await this.sendGroupMessage(
        `messages.farming-initiated.${result.id}`,
        [
          `<b>${result.title}</b>`,
          "<i>✅ Status: Initiated</i>",
          `\n<blockquote><a href="${result.config.telegramLink}">Open Telegram Bot</a></blockquote>${users}`,
          `<b>🗓️ Date</b>: ${utils.dateFns.format(
            new Date(),
            "yyyy-MM-dd HH:mm:ss"
          )}`,
        ],
        { ["message_thread_id"]: result.config.threadId }
      );
    } catch (error) {
      console.error(error);
    }
  }

  /** Send User Update Complete Message */
  async sendUserUpdateCompleteMessage(result) {
    try {
      const users = utils.formatUsers(
        result.accounts.map((account) => {
          return {
            id: account.id,
            status: account.session ? "✅" : "❌",
            session: account.session ? "🟨" : "🟪",
            username: account.user?.username ?? "",
            title: account.title,
          };
        })
      );

      const startDate = utils.dateFns.format(
        result.startDate,
        "yyyy-MM-dd HH:mm:ss"
      );

      const endDate = utils.dateFns.format(
        result.endDate,
        "yyyy-MM-dd HH:mm:ss"
      );

      return await this.sendGroupMessage(
        "messages.user-update.completed",
        [
          `<b>🌐 Accounts Update</b>`,
          "<i>✅ Status: Completed</i>",
          `\n<blockquote><i>Telegram Account updated!</i></blockquote>${users}`,
          `<b>🗓️ Start Date</b>: ${startDate}`,
          `<b>🗓️ End Date</b>: ${endDate}`,
        ],
        { ["message_thread_id"]: app.chat.threads.announcement }
      );
    } catch (error) {
      console.error(error);
    }
  }

  /** Send Server Address */
  async sendServerAddress(address) {
    try {
      const date = utils.dateFns.format(new Date(), "yyyy-MM-dd HH:mm:ss");

      return await this.sendGroupMessage(
        "messages.startup.server-address",
        [
          `<b>☁️ Latest Fly Server</b>`,
          `<b>🚀 Address</b>: ${address}`,
          `<b>🗓️ Updated</b>: ${date}`,
        ],
        { ["message_thread_id"]: app.chat.threads.announcement }
      );
    } catch (error) {
      console.error(error);
    }
  }

  /** Send Private Message */
  async sendPrivateMessage(account, message) {
    try {
      this.api.sendMessage(account.id, message.join("\n"), {
        ["parse_mode"]: "HTML",
      });
    } catch (error) {
      console.error(error);
    }
  }
}

const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new GroupBot(process.env.TELEGRAM_BOT_TOKEN)
  : null;

export default bot;
