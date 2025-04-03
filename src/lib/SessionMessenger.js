import { Api } from "telegram";
import { NewMessage } from "telegram/events";

import { customLogger } from "./utils";

export default class SessionMessenger {
  /**
   * Construct the Messenger
   * @param {object} param0
   * @param {import("telegram").TelegramClient} param0.client
   * @param {string} param0.entity
   * @param {string} param0.startParam
   */
  constructor({ client, entity, startParam }) {
    this._client = client;
    this._entity = entity;
    this._startParam = startParam;
  }

  sendMessage(message, options) {
    return this.waitForReply(() =>
      this._client.sendMessage(this._entity, {
        ...options,
        message,
      })
    );
  }

  /** Send Start */
  sendStart() {
    return this.sendMessage("/start");
  }

  /** Start Bot */
  startBot() {
    return this.waitForReply(() =>
      this._client.invoke(
        new Api.messages.StartBot({
          bot: this._entity,
          peer: this._entity,
          startParam: this._startParam,
        })
      )
    );
  }

  async waitForReply(callback) {
    /** Await Callback */
    await callback();

    return new Promise((resolve) => {
      /** Event to Handle */
      const eventToHandle = new NewMessage({
        fromUsers: [this._entity],
      });

      /**
       * @param {import("telegram/events").NewMessageEvent} event
       */
      const handler = (event) => {
        this._client.removeEventHandler(handler, eventToHandle);
        customLogger("BOT RECEIVED EVENT", event);
        resolve(event);
      };

      /** Add Event */
      this._client.addEventHandler(handler, eventToHandle);
    });
  }
}
