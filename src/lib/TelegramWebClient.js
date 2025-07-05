import EventEmitter from "events";
import { Api } from "telegram";
import { NewMessage, Raw } from "telegram/events";
import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import { UpdateConnectionState } from "telegram/network";

import {
  customLogger,
  delayForSeconds,
  extractTgWebAppData,
  parseTelegramLink,
} from "./utils";

export default class TelegramWebClient extends TelegramClient {
  /** Construct Class */
  constructor(session) {
    const stringSession = new StringSession(session);
    super(stringSession, 2496, "8da85b0d5bfe62527e5b244c209159c3", {
      appVersion: "2.2 K",
      deviceModel: navigator.userAgent,
      systemVersion: navigator.platform,
      systemLangCode: "en-US",
      langCode: "en",
      useWSS: true,
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

  async connect() {
    if (this.connected) return;
    else if (this._isConnecting) {
      return new Promise((resolve, reject) => {
        this._connectionQueue.push({ resolve, reject });
      });
    } else {
      this._isConnecting = true;

      try {
        await delayForSeconds(1);
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
    return callback();
  }

  /** Wait for Reply */
  _waitForReply(entity, { filter } = {}) {
    return new Promise((resolve) => {
      /** Event to Handle */
      const telegramEvent = new NewMessage({
        fromUsers: [entity],
      });

      /**
       * @param {import("telegram/events").NewMessageEvent} event
       */
      const handler = (event) => {
        customLogger("BOT RECEIVED MESSAGE", event);

        if (typeof filter === "undefined" || filter(event.message)) {
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
    /** Start the Bot */
    const result = await this.invoke(
      new Api.messages.StartBot({
        bot: entity,
        peer: entity,
        startParam: startParam,
      })
    );

    /** Log Bot Start */
    customLogger("START BOT", result);

    /** Wait for Reply */
    if (shouldWaitForReply) {
      return this._waitForReply(entity, replyOptions);
    }
  }

  /** Start Bot from Link */
  startBotFromLink({ link, startOptions, replyOptions }) {
    return this.execute(() => {
      const { entity, startParam } = parseTelegramLink(link);
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
      let parsed = parseTelegramLink(link);
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

      /** Start the Bot */
      if (!parsed.shortName) {
        await this.startBot({
          entity: parsed.entity,
          startParam: parsed.startParam,
        });
      }

      const result = await this.invoke(
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

      /** Webview */
      customLogger("WEBVIEW", {
        link,
        result,
      });

      return result;
    });
  }

  /** Get Telegram WebApp */
  async getTelegramWebApp(link) {
    const webview = await this.getWebview(link);
    const result = extractTgWebAppData(webview.url);

    /** Log */
    customLogger("TELEGRAM WEB APP", {
      link,
      result,
    });

    return result;
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return this.execute(async () => {
      try {
        const parsed = parseTelegramLink(link);
        const result = await this.invoke(
          parsed.entity.startsWith("+")
            ? new Api.messages.ImportChatInvite({
                hash: parsed.entity.replace("+", ""),
              })
            : new Api.channels.JoinChannel({
                channel: parsed.entity,
              })
        );

        /** Log */
        customLogger("JOINED CHANNEL", {
          link,
          result,
        });

        /** Return Result */
        return result;
      } catch (error) {
        console.error(error);
        if (
          error.message.includes("USER_ALREADY_PARTICIPANT") === false &&
          error.message.includes("INVITE_REQUEST_SENT") === false
        ) {
          throw error;
        }
      }
    });
  }

  /** Logout */
  logout() {
    return this.execute(() => this.invoke(new Api.auth.LogOut({})));
  }
}
