import {
  farmerErrorMessage,
  farmingInitiatedMessage,
  profileCleanMessage,
  serverAddressMessage,
  userUpdateMessage,
} from "./messages.js";

import { Bot } from "grammy";
import app from "../../config/app.js";
import cache from "../cache.js";
import logger from "../logger.js";
import utils from "../utils.js";

export default class GroupBot extends Bot {
  /** Append the server name line when one is configured */
  withServerName(messages) {
    if (!app.name) return messages;

    return [...messages, `<i>🖥️ ${utils.escapeHtml(String(app.name))}</i>`];
  }

  /** Send a group message, removing the previous one sent under the same cache key */
  async sendGroupMessage(cacheKey, message, options = {}) {
    try {
      const previous = await cache.get(cacheKey);
      const html = this.withServerName(message).join("\n");

      const sent = await this.api.sendMessage(app.chat.id, html, {
        ...options,
        ["parse_mode"]: "HTML",
        ["link_preview_options"]: { ["is_disabled"]: true },
      });

      await cache.set(cacheKey, sent["message_id"]);

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
  async sendFarmingInitiatedMessage(run) {
    try {
      return await this.sendGroupMessage(
        `messages.farming-initiated.${run.id}`,
        farmingInitiatedMessage(run),
        { ["message_thread_id"]: run.threadId },
      );
    } catch (error) {
      logger.error("Error sending farming initiated message:", error);
    }
  }

  /** Send Profile Clean Complete Message */
  async sendProfileCleanCompleteMessage(cleanup) {
    try {
      return await this.sendGroupMessage(
        "messages.profile-clean.completed",
        profileCleanMessage(cleanup),
        { ["message_thread_id"]: app.chat.threads.operations },
      );
    } catch (error) {
      logger.error(error);
    }
  }

  /** Send User Update Complete Message */
  async sendUserUpdateCompleteMessage(result) {
    try {
      return await this.sendGroupMessage(
        "messages.user-update.completed",
        userUpdateMessage(result),
        { ["message_thread_id"]: app.chat.threads.announcement },
      );
    } catch (error) {
      logger.error(error);
    }
  }

  /** Send Server Address */
  async sendServerAddress(address) {
    try {
      return await this.sendGroupMessage(
        "messages.startup.server-address",
        serverAddressMessage(address),
        { ["message_thread_id"]: app.chat.threads.announcement },
      );
    } catch (error) {
      logger.error(error);
    }
  }

  /** Send Farmer Error Message */
  async sendFarmerErrorMessage(
    id,
    title,
    accountId,
    currentTask,
    errorMessage,
  ) {
    try {
      return await this.sendGroupMessage(
        `messages.error.${id}.${accountId}`,
        farmerErrorMessage(title, accountId, currentTask, errorMessage),
        { ["message_thread_id"]: app.chat.threads.error },
      );
    } catch (error) {
      logger.error(error);
    }
  }

  /** Send Primary Account Missing Message */
  async sendPrimaryAccountMissingMessage(id, messages) {
    try {
      return await this.sendGroupMessage(
        `messages.primary-account.${id}`,
        messages,
        { ["message_thread_id"]: app.chat.threads.error },
      );
    } catch (error) {
      logger.error(error);
    }
  }

  /** Send an operations message to the group's Operations topic */
  async sendOperationMessage(messages, options = {}) {
    if (
      app.disableTelegramMessages ||
      !app.chat.id ||
      !app.chat.threads.operations
    ) {
      return;
    }

    try {
      const html = this.withServerName(messages).join("\n");

      await this.api.sendMessage(app.chat.id, html, {
        ["parse_mode"]: "HTML",
        ["message_thread_id"]: app.chat.threads.operations,
        ...options,
      });
    } catch (error) {
      logger.error("Failed to send operation message:", error);
    }
  }

  /** Send Private Message */
  async sendPrivateMessage(id, messages, options = {}) {
    try {
      await this.api.sendMessage(id, messages.join("\n"), {
        ["parse_mode"]: "HTML",
        ...options,
      });
    } catch (error) {
      logger.error(error);
    }
  }

  /** Send a private message to the server admin; no-op when messages are off or no admin is set */
  async sendAdminMessage(messages, options = {}) {
    if (app.disableTelegramMessages || !app.admin.telegramId) {
      return;
    }

    return this.sendPrivateMessage(
      app.admin.telegramId,
      this.withServerName(messages),
      options,
    );
  }
}
