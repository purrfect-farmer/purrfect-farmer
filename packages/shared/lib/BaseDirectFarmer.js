import { Api } from "telegram";
import { NewMessage } from "telegram/events/NewMessage.js";
import { EditedMessage } from "telegram/events/EditedMessage.js";
import BaseFarmer from "./BaseFarmer.js";

export default class BaseDirectFarmer extends BaseFarmer {
  static type = "direct";

  /** Send Message
   * @param {string | import("telegram").Api.TypeInputMessage} message
   * @param {object} options
   * @param {object} replyOptions
   * @return {Promise<import("telegram").Api.Message>}
   */
  sendMessage(message, options, replyOptions) {
    return this.waitForReply(
      () =>
        this.client.sendMessage(this.entity, {
          ...options,
          message,
        }),
      replyOptions
    );
  }

  /**
   * Click Button
   * @param {import("telegram").Api.Message} message
   * @param {string} search
   * @param {object} param2
   * @param {boolean} param2.edited
   * @param {boolean} param2.hasButtons
   * @return {Promise<import("telegram").Api.Message>}
   */
  clickButton(
    message,
    search,
    { edited = false, hasButtons = true, ...options } = {}
  ) {
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
        ...options,
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

  /** Send Start */
  sendStart() {
    return this.sendMessage("/start");
  }

  /** Start Bot */
  startBot(options) {
    return this.waitForReply(
      () =>
        this.client.invoke(
          new Api.messages.StartBot({
            bot: this.entity,
            peer: this.entity,
            startParam: this.startParam,
          })
        ),
      options
    );
  }

  async waitForReply(
    callback,
    { edited = false, filter, timeout = 5000 } = {}
  ) {
    return new Promise(async (resolve, reject) => {
      /** Timeout */
      const rejectTimeout = setTimeout(() => {
        this.client.removeEventHandler(handler, eventToHandle);
        reject(new Error("Timeout waiting for reply"));
      }, timeout);

      /** Event to Handle */
      const eventToHandle = edited
        ? new EditedMessage({
            fromUsers: [this.entity],
          })
        : new NewMessage({
            fromUsers: [this.entity],
          });

      /**
       * Message Handler
       * @param {import("telegram/events").NewMessageEvent | import("telegram/events/EditedMessage").EditedMessage} event
       */
      const handler = (event) => {
        this.debugger.log("Message received:", event.message);

        /** Check Filter */
        if (event.message && (!filter || filter(event.message))) {
          this.client.removeEventHandler(handler, eventToHandle);
          this.lastMessage = event.message;
          clearTimeout(rejectTimeout);
          resolve(event.message);
        }
      };

      /** Add Event */
      this.client.addEventHandler(handler, eventToHandle);

      /** Await Callback */
      this.debugger.log(
        "Callback result:",
        await callback().catch((error) => {
          this.client.removeEventHandler(handler, eventToHandle);
          clearTimeout(rejectTimeout);
          reject(error);
        })
      );
    });
  }
}
