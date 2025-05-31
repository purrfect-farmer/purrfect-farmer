import EventEmitter from "events";
import { Api } from "telegram";
import { NewMessage, Raw } from "telegram/events";
import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import { UpdateConnectionState } from "telegram/network";

import { customLogger, extractTgWebAppData, parseTelegramLink } from "./utils";

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
    });

    /** Custom Emitter */
    this.emitter = new EventEmitter();

    /** Add Connected Event Handler */
    this.addEventHandler(
      (event) => {
        this.emitter.emit(
          "update-connection-state",
          event.state === UpdateConnectionState.connected
        );
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

  /** Start */
  start(params) {
    return super.start(params).then(() => this.session.save());
  }

  /**
   * Executes a callback with the Telegram Client instance.
   *
   * @returns {Promise<any>} The result of the callback.
   */
  async execute(callback) {
    /** Connect  */
    await this.connect();

    /** Ensure User is Authorized  */
    if (await this.isUserAuthorized()) {
      return callback();
    } else {
      throw new Error("Not connected!");
    }
  }

  /** Wait for Reply */
  waitForReply(entity, { filter } = {}) {
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

  /** Core Start Bot */
  async coreStartBot(
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
      return this.waitForReply(entity, replyOptions);
    }
  }

  /** Start Bot from Link */
  startBotFromLink({ link, startOptions, replyOptions }) {
    return this.execute(() => {
      const { entity, startParam } = parseTelegramLink(link);
      return this.coreStartBot(
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
      let url;
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
        await this.coreStartBot({
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
        if (
          error.message.includes("USER_ALREADY_PARTICIPANT") === false &&
          error.message.includes("INVITE_REQUEST_SENT") === false
        ) {
          throw error;
        }
      }
    });
  }
}
