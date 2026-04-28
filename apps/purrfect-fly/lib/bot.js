import { Bot } from "grammy";
import app from "../config/app.js";
import cache from "./cache.js";
import logger from "./logger.js";
import utils from "./utils.js";

class GroupBot extends Bot {
  /** Send Group Message
   *
   * This method will send a new message and automatically remove the previous message
   * with the same cache key
   */
  async sendGroupMessage(cacheKey, message, options = {}) {
    try {
      const previous = await cache.get(cacheKey);
      const html = message.join("\n");

      const sent = await this.api.sendMessage(app.chat.id, html, {
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
        logger.error("Failed to remove previous message:", error);
      }

      return message;
    } catch (error) {
      logger.error("Error sending group message:", error);
    }
  }

  /** Send Farming Initiated Message */
  async sendFarmingInitiatedMessage({
    id,
    title,
    link,
    telegramLink,
    threadId,
    results,
    totalCount,
    executedCount,
  }) {
    try {
      const users = utils.formatUsers(
        results.map(({ account, result }) => {
          return {
            id: account.id,
            status:
              result.status === "started"
                ? "✅"
                : result.status === "running"
                  ? "☑️"
                  : "❌",
            session: telegramLink ? (account.session ? "🟨" : "🟪") : "",

            username: account.user?.username || "",
            title: account.title,
            info:
              result.status === "running"
                ? [
                    `<b>TSK:</b> <code>${result.currentTask}</code>`,
                    `<b>ELP:</b> <code>${result.elapsed}</code>`,
                  ].join("\n")
                : null,
          };
        }),
      );

      const statusDate = utils.dateFns.format(
        new Date(),
        "yyyy-MM-dd HH:mm:ss",
      );

      return await this.sendGroupMessage(
        `messages.farming-initiated.${id}`,
        [
          `<b>${title}</b>`,
          `<i>✅ Status: Initiated (${executedCount}/${totalCount})</i>\n`,
          `<blockquote><a href="${link || telegramLink}">Open ${
            link ? "Link" : "Telegram Bot"
          }</a></blockquote>${users}`,
          `<b>🗓️ Date</b>: ${statusDate}`,
        ],
        { ["message_thread_id"]: threadId },
      );
    } catch (error) {
      logger.error("Error sending farming initiated message:", error);
    }
  }

  /** Send User Update Complete Message */
  async sendUserUpdateCompleteMessage(result) {
    try {
      const users = utils.formatUsers(
        result.accounts.map((account) => {
          return {
            id: account.id,
            status: "✅",
            session: account.session ? "🟨" : "🟪",
            username: account.user?.username || "",
            title: account.title,
          };
        }),
      );

      const startDate = utils.dateFns.format(
        result.startDate,
        "yyyy-MM-dd HH:mm:ss",
      );

      const endDate = utils.dateFns.format(
        result.endDate,
        "yyyy-MM-dd HH:mm:ss",
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
        { ["message_thread_id"]: app.chat.threads.announcement },
      );
    } catch (error) {
      logger.error(error);
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
        { ["message_thread_id"]: app.chat.threads.announcement },
      );
    } catch (error) {
      logger.error(error);
    }
  }

  /** Send Private Message */
  async sendPrivateMessage(id, message) {
    try {
      this.api.sendMessage(id, message.join("\n"), {
        ["parse_mode"]: "HTML",
      });
    } catch (error) {
      logger.error(error);
    }
  }
}

const token = env("TELEGRAM_BOT_TOKEN");
const bot = token ? new GroupBot(token) : null;

export default bot;
