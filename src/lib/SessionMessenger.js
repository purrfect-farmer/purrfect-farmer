import { Api } from "telegram";
import { EditedMessage } from "telegram/events/EditedMessage";
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
    this._lastMessage = null;
  }

  get lastMessage() {
    return this._lastMessage;
  }

  sendMessage(message, options) {
    return this.waitForReply(() =>
      this._client.sendMessage(this._entity, {
        ...options,
        message,
      })
    );
  }

  /**
   * Click Button
   * @param {import("telegram").Api.Message} message
   * @param {string} search
   * @param {object} param2
   * @param {boolean} param2.edited
   * @param {boolean} param2.hasButtons
   */
  clickButton(message, search, { edited = true, hasButtons = true } = {}) {
    return this.waitForReply(
      () =>
        message.click({
          text: (input) =>
            new RegExp(
              ["\\", "(", ")", ".", "|", "^"].reduce(
                (result, item) => result.replaceAll(item, "\\" + item),
                search
              ),
              "i"
            ).test(input),
        }),
      {
        edited,
        filter(message) {
          return hasButtons !== true || message.buttonCount > 0;
        },
      }
    );
  }

  /**
   * Click Path
   * @param {import("telegram").Api.Message} message
   * @param {string} path
   */
  async clickPath(message, path) {
    let currentMessage = message;

    for (const search of path.split(/\s*>\s*/)) {
      currentMessage = await this.clickButton(currentMessage, search);
    }

    return currentMessage;
  }

  async returnToHome() {
    let currentMessage = this.lastMessage;
    let button;

    while (
      (button = currentMessage.buttons
        .flat()
        .find((button) =>
          ["🏠", "⬆️", "⬅️", "⚪️"].some((search) =>
            button.text.includes(search)
          )
        ))
    ) {
      currentMessage = await this.waitForReply(
        () =>
          button.click({
            sharePhone: false,
          }),
        {
          edited: true,
          filter(message) {
            return message.buttonCount > 0;
          },
        }
      );
    }

    return currentMessage;
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

  async waitForReply(callback, { edited = false, filter } = {}) {
    return new Promise(async (resolve) => {
      /** Event to Handle */
      const eventToHandle = edited
        ? new EditedMessage({
            fromUsers: [this._entity],
          })
        : new NewMessage({
            fromUsers: [this._entity],
          });

      /**
       * @param {import("telegram/events").NewMessageEvent | import("telegram/events/EditedMessage").EditedMessage} event
       */
      const handler = (event) => {
        customLogger("BOT RECEIVED MESSAGE", event.message);

        if (
          event.message &&
          (typeof filter === "undefined" || filter(event.message))
        ) {
          this._client.removeEventHandler(handler, eventToHandle);
          setTimeout(resolve, 500, (this._lastMessage = event.message));
        }
      };

      /** Add Event */
      this._client.addEventHandler(handler, eventToHandle);

      /** Await Callback */
      customLogger("BOT CALLBACK", await callback());
    });
  }
}
