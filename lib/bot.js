const { Bot } = require("grammy");

const utils = require("./utils");
const cache = require("./cache");
const app = require("../config/app");

class GroupBot extends Bot {
  /** Send Group Message */
  async sendGroupMessage(cacheKey, message, options = {}) {
    const previous = await cache.get(cacheKey);
    const sent = await this.api.sendMessage(app.chatId, message.join("\n"), {
      ...options,
      ["parse_mode"]: "HTML",
      ["link_preview_options"]: { ["is_disabled"]: true },
    });

    /** Store Message ID */
    await cache.set(cacheKey, sent["message_id"]);

    /** Remove Previous Message */
    try {
      if (previous) {
        await this.api.deleteMessage(app.chatId, previous);
      }
    } catch (error) {
      console.error(error);
    }

    return message;
  }

  /** Send Farming Complete Message */
  async sendFarmingCompleteMessage(result) {
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
        `messages.farming-completed.${result.config.id}`,
        [
          `<b>${result.config.title}</b>`,
          "<i>✅ Status: Completed</i>",
          `\n<blockquote><a href="${result.config.telegramLink}">Open Telegram Bot</a></blockquote>${users}`,
          `<b>🗓️ Start Date</b>: ${utils.dateFns.format(
            result.startDate,
            "yyyy-MM-dd HH:mm:ss"
          )}`,
          `<b>🗓️ End Date</b>: ${utils.dateFns.format(
            result.endDate,
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

      return await this.sendGroupMessage(
        "messages.user-update.completed",
        [
          `<b>🌐 Telegram WebAppData</b>`,
          "<i>✅ Status: Completed</i>",
          `\n<blockquote><i>WebAppData updated!</i></blockquote>${users}`,
          `<b>🗓️ Start Date</b>: ${utils.dateFns.format(
            result.startDate,
            "yyyy-MM-dd HH:mm:ss"
          )}`,
          `<b>🗓️ End Date</b>: ${utils.dateFns.format(
            result.endDate,
            "yyyy-MM-dd HH:mm:ss"
          )}`,
        ],
        { ["message_thread_id"]: app.announcementThreadId }
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

module.exports = bot;
