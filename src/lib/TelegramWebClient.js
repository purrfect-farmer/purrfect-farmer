import EventEmitter from "events";
import { Api } from "@/lib/gramjs";
import { NewMessage, Raw } from "@/lib/gramjs/events";
import { StringSession } from "@/lib/gramjs/sessions";
import { TelegramClient } from "@/lib/gramjs";
import { UpdateConnectionState } from "@/lib/gramjs/network";

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
      useWSS: true,
    });

    /** Is Authorized */
    this._isAuthorized = false;

    /** Is Flushing */
    this._flushing = false;

    /** Call Queue */
    this._callQueue = [];

    /** Custom Emitter */
    this._emitter = new EventEmitter();

    /** Add Connected Event Handler */
    this.addEventHandler(
      async (event) => {
        /** Status */
        const status = event.state === UpdateConnectionState.connected;

        /** Emit Status */
        this._emitter.emit("update-connection-state", status);

        /** Connected */
        if (status) {
          /** Check Authorization State */
          await this._checkUserAuthorizedState();

          /** Flush Queue */
          this._flushQueue();
        } else {
          this._isAuthorized = false;
        }
      },
      new Raw({
        types: [UpdateConnectionState],
      })
    );
  }

  /** Get Authorized State */
  get authorized() {
    return this._isAuthorized;
  }

  /** Add Connection Listener */
  onConnectionState(callback) {
    return this._emitter.addListener("update-connection-state", callback);
  }

  /** Remove Connection Listener */
  offConnectionState(callback) {
    return this._emitter.removeListener("update-connection-state", callback);
  }

  /** Add Authorized Listener */
  onUserIsAuthorized(callback) {
    return this._emitter.addListener("user-is-authorized", callback);
  }

  /** Remove Authorized Listener */
  offUserIsAuthorized(callback) {
    return this._emitter.removeListener("user-is-authorized", callback);
  }

  /** Check User Authorized State */
  async _checkUserAuthorizedState() {
    /** Get Authorized State  */
    this._isAuthorized = await this.isUserAuthorized();

    /** Emit Authorized Event */
    this._emitter.emit("user-is-authorized", this._isAuthorized);
  }

  /** Start */
  async start(params) {
    /** Call super Start */
    await super.start(params);

    /** Check Authorized State */
    await this._checkUserAuthorizedState();

    /** Return Saved Session */
    return this.session.save();
  }

  /** Connect */
  async connect() {
    /** Call super Connect */
    await super.connect();

    /** Check Authorized State */
    await this._checkUserAuthorizedState();
  }

  /** Flush Queue */
  async _flushQueue() {
    if (this._flushing) return;
    this._flushing = true;

    for (const { callback, resolve, reject } of this._callQueue) {
      try {
        if (this._isAuthorized) {
          const result = await callback();
          resolve(result);
        } else {
          throw new Error("User is not authorized!");
        }
      } catch (error) {
        reject(error);
      }
    }
    this._callQueue.length = 0;
    this._flushing = false;
  }

  /**
   * Executes a callback with the Telegram Client instance.
   *
   * @returns {Promise<any>} The result of the callback.
   */
  async _execute(callback) {
    if (this.connected) {
      if (this._isAuthorized) {
        return callback();
      } else {
        throw new Error("User is not authorized!");
      }
    } else {
      console.warn("Queuing call — client not connected.");
      console.log("Queue length:", this._callQueue.length + 1);

      return new Promise((resolve, reject) => {
        this._callQueue.push({ callback, resolve, reject });
      });
    }
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

  /** Core Start Bot */
  async _coreStartBot(
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
    return this._execute(() => {
      const { entity, startParam } = parseTelegramLink(link);
      return this._coreStartBot(
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
    return this._execute(async () => {
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
        await this._coreStartBot({
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
    return this._execute(async () => {
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

  /** Logout */
  logout() {
    return this._execute(() => this.invoke(new Api.auth.LogOut({})));
  }
}
