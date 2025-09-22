import EventEmitter from "events";
import { Api, TelegramClient } from "telegram";
import { NewMessage, Raw } from "telegram/events/index.js";
import { StringSession } from "telegram/sessions/index.js";
import { UpdateConnectionState } from "telegram/network/index.js";

import utils from "../utils/index.js";

export default class BaseTelegramWebClient extends TelegramClient {
  /** Construct Class */
  constructor(session, options = {}) {
    const stringSession = new StringSession(session);
    super(stringSession, 2496, "8da85b0d5bfe62527e5b244c209159c3", {
      appVersion: "2.2 K",
      systemLangCode: "en-US",
      langCode: "en",
      ...options,
    });

    /** Connection Queue */
    this._connectionQueue = [];

    /** Is Connecting */
    this._isConnecting = false;

    /** Is Authorized */
    this._isAuthorized = false;

    /** Custom Emitter */
    this.emitter = new EventEmitter();

    /** Add Connected Event Handler */
    this.addEventHandler(
      async (event) => {
        /** Status */
        const connected = event.state === UpdateConnectionState.connected;

        /** Emit Status */
        this.emitter.emit("update-connection-state", connected);

        /** Connected */
        if (connected) {
          /** Authorized */
          this._isAuthorized = await this.isUserAuthorized();
        } else {
          /** Unauthorized */
          this._isAuthorized = false;
        }
      },
      new Raw({
        types: [UpdateConnectionState],
      })
    );
  }

  /** Add Connection Listener */
  onConnectionState(callback) {
    return this.emitter.addListener("update-connection-state", callback);
  }

  /** Remove Connection Listener */
  offConnectionState(callback) {
    return this.emitter.removeListener("update-connection-state", callback);
  }

  /** Connect */
  async connect() {
    if (this.connected) return;
    else if (this._isConnecting) {
      return new Promise((resolve, reject) => {
        this._connectionQueue.push({ resolve, reject });
      });
    } else {
      this._isConnecting = true;

      try {
        await utils.delayForSeconds(1);
        await super.connect();
        this._connectionQueue.forEach((item) => item.resolve());
      } catch (error) {
        this._connectionQueue.forEach((item) => item.reject(error));
      } finally {
        this._connectionQueue.length = 0;
        this._isConnecting = false;
      }
    }
  }

  /** Start */
  async start(params) {
    /** Call super Start */
    await super.start(params);

    /** Check Authorization */
    this._isAuthorized = await this.isUserAuthorized();

    /** Return Saved Session */
    return this.session.save();
  }

  /**
   * Executes a callback with the Telegram Client instance.
   *
   * @returns {Promise<any>} The result of the callback.
   */
  async execute(callback) {
    await this.connect();
    return callback(this);
  }

  /** Get Self */
  getSelf() {
    return this.execute(async () => {
      try {
        return await this.getMe();
      } catch (error) {
        console.error(error);
        return null;
      }
    });
  }

  /** Wait for Reply */
  _waitForReply(entity, { filter } = {}) {
    return new Promise((resolve, reject) => {
      /** Rejection Timeout */
      const timeout = setTimeout(() => {
        this.removeEventHandler(handler, telegramEvent);
        reject(new Error("TIMEOUT"));
      }, 10_000);

      /** Event to Handle */
      const telegramEvent = new NewMessage({
        fromUsers: [entity],
      });

      /**
       * @param {import("telegram/events").NewMessageEvent} event
       */
      const handler = (event) => {
        if (typeof filter !== "function" || filter(event.message)) {
          clearTimeout(timeout);
          this.removeEventHandler(handler, telegramEvent);
          resolve(event.message);
        }
      };

      /** Add Event */
      this.addEventHandler(handler, telegramEvent);
    });
  }

  /** Start Bot */
  async startBot(
    { entity, startParam = "", shouldWaitForReply = true } = {},
    replyOptions = {}
  ) {
    const reply = shouldWaitForReply
      ? this._waitForReply(entity, replyOptions)
      : Promise.resolve();

    /** Start the Bot */
    const result = await this.invoke(
      new Api.messages.StartBot({
        bot: entity,
        peer: entity,
        startParam: startParam,
      })
    );

    return await reply;
  }

  /** Start Bot from Link */
  startBotFromLink({ link, startOptions, replyOptions }) {
    return this.execute(() => {
      const { entity, startParam } = utils.parseTelegramLink(link);
      return this.startBot(
        {
          ...startOptions,
          entity,
          startParam,
        },
        replyOptions
      );
    });
  }

  /** Get Webview */
  getWebview(link) {
    return this.execute(async () => {
      let webviewButton,
        parsed = utils.parseTelegramLink(link);
      const themeParams = new Api.DataJSON({
        data: JSON.stringify({
          bg_color: "#ffffff",
          text_color: "#000000",
          hint_color: "#aaaaaa",
          link_color: "#006aff",
          button_color: "#2cab37",
          button_text_color: "#ffffff",
        }),
      });

      let result = null;

      /** Start the Bot */
      if (!parsed.shortName) {
        const dialogs = await this.getDialogs({});
        const botChat = dialogs.find(
          (d) =>
            d.entity?.username?.toLowerCase() === parsed.entity?.toLowerCase()
        );

        if (!botChat) {
          await this.startBot({
            entity: parsed.entity,
            startParam: parsed.startParam,
          });
        }

        const messages = await this.getMessages(parsed.entity, {
          limit: 20,
        });
        const messagesWithButtons = messages.filter((msg) => {
          return msg.buttonCount > 0;
        });

        for (const msg of messagesWithButtons) {
          const buttons = msg.buttons.flat().map((btn) => btn.button);

          for (const button of buttons) {
            if (utils.isBotURL(button.url)) {
              parsed = utils.parseTelegramLink(button.url);
              break;
            } else if (
              button instanceof Api.KeyboardButtonWebView ||
              button instanceof Api.KeyboardButtonSimpleWebView
            ) {
              webviewButton = button;
              break;
            }
          }
        }
      }

      /** Request Webview */
      if (webviewButton) {
        result = await this.invoke(
          webviewButton instanceof Api.KeyboardButtonWebView
            ? new Api.messages.RequestWebView({
                platform: "android",
                bot: parsed.entity,
                peer: parsed.entity,
                url: webviewButton.url,
                themeParams,
              })
            : new Api.messages.RequestSimpleWebView({
                platform: "android",
                bot: parsed.entity,
                url: webviewButton.url,
                themeParams,
              })
        );
      } else {
        result = await this.invoke(
          !parsed.shortName
            ? new Api.messages.RequestMainWebView({
                platform: "android",
                bot: parsed.entity,
                peer: parsed.entity,
                startParam: parsed.startParam,
                themeParams,
              })
            : new Api.messages.RequestAppWebView({
                platform: "android",
                peer: parsed.entity,
                startParam: parsed.startParam,
                app: new Api.InputBotAppShortName({
                  botId: await this.getInputEntity(parsed.entity),
                  shortName: parsed.shortName,
                }),
                themeParams,
              })
        );
      }

      return result;
    });
  }

  /** Get Telegram WebApp */
  async getTelegramWebApp(link) {
    const webview = await this.getWebview(link);
    const result = utils.extractTgWebAppData(webview.url);

    return result;
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return this.execute(async () => {
      try {
        const parsed = utils.parseTelegramLink(link);

        await this.invoke(
          parsed.entity.startsWith("+")
            ? new Api.messages.ImportChatInvite({
                hash: parsed.entity.replace("+", ""),
              })
            : new Api.channels.JoinChannel({
                channel: parsed.entity,
              })
        );

        return true;
      } catch (error) {
        if (
          typeof error === "string" &&
          !error.includes("USER_ALREADY_PARTICIPANT") &&
          !error.includes("INVITE_REQUEST_SENT")
        ) {
          return false;
        }

        return true;
      }
    });
  }

  /** Leave Conversation */
  leaveConversation(id) {
    return this.execute(() => {
      return this.invoke(
        new Api.channels.LeaveChannel({
          channel: id,
        })
      );
    });
  }

  /** Delete and Block Bot */
  async deleteAndBlockBot(entity) {
    return this.execute(async () => {
      await this.invoke(
        new Api.messages.DeleteHistory({
          peer: entity,
          revoke: true,
        })
      );

      await this.invoke(
        new Api.contacts.Block({
          id: entity,
        })
      );
    });
  }

  /** Logout */
  logout() {
    return this.execute(() => this.invoke(new Api.auth.LogOut({})));
  }
}
