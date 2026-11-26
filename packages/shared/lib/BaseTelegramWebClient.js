import { Api, TelegramClient } from "telegram";
import { NewMessage, Raw } from "telegram/events/index.js";
import {
  DEFAULT_THEME_PARAMS,
  DEFAULT_WEB_APP_PLATFORM,
  extractTgWebAppData,
  isBotMiniAppLink,
  parseTelegramLink,
} from "../utils/telegram.js";

import EventEmitter from "events";
import { StringSession } from "telegram/sessions/index.js";
import {
  TELEGRAM_API_HASH,
  TELEGRAM_API_ID,
  TELEGRAM_CLIENT_OPTIONS,
} from "../utils/telegramClient.js";
import { UpdateConnectionState } from "telegram/network/index.js";
import { delayForSeconds } from "../utils/delay.js";

export default class BaseTelegramWebClient extends TelegramClient {
  webviewCache = new Map();

  /** Construct Class */
  constructor(session, options = {}) {
    super(
      typeof session === "string" ? new StringSession(session) : session,
      TELEGRAM_API_ID,
      TELEGRAM_API_HASH,
      {
        ...TELEGRAM_CLIENT_OPTIONS,
        ...options,
      },
    );

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
      }),
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
    { entity, startParam = "start", shouldWaitForReply = true } = {},
    replyOptions = {},
  ) {
    const reply = shouldWaitForReply
      ? this._waitForReply(entity, replyOptions)
      : Promise.resolve();

    /** Start the Bot */
    const result = await this.invoke(
      new Api.messages.StartBot({
        bot: entity,
        peer: entity,
        startParam,
      }),
    );

    return await reply;
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
        replyOptions,
      );
    });
  }

  async getCachedUser() {
    this.cachedUser = this.cachedUser || (await this.getSelf());
    return this.cachedUser;
  }

  /** The bot's menu button webview, or null when it has a main app or no web menu */
  async _getMenuButtonWebview(entity) {
    const { users, fullUser } = await this.invoke(
      new Api.users.GetFullUser({ id: entity }),
    );
    const bot = users[0];
    const menuButton = fullUser.botInfo?.menuButton;

    if (bot?.botHasMainApp || !(menuButton instanceof Api.BotMenuButton)) {
      return null;
    }

    return { url: menuButton.url, type: "menu" };
  }

  /** Get Webview */
  getWebview(link, { allowCache = true } = {}) {
    return this.execute(async () => {
      const themeParams = new Api.DataJSON({
        data: JSON.stringify(DEFAULT_THEME_PARAMS),
      });

      const parsed = parseTelegramLink(link);
      const entityKey = parsed.entity?.toLowerCase();
      const startParam = parsed.startParam || "start";
      const isStartApp = parsed.isStartApp;

      const cacheKey = `${entityKey}`;
      const cached = allowCache ? this.webviewCache.get(cacheKey) : null;

      let webview = cached?.webview;
      let miniApp = cached?.miniApp;
      let result = null;

      /** Set mini app */
      if (parsed.shortName) {
        miniApp = parsed;
      } else if (!isStartApp && !cached) {
        /** Find Bot Chat */
        const dialogs = await this.getDialogs({});
        const botChat = dialogs.find(
          (d) => d.entity?.username?.toLowerCase() === entityKey,
        );

        if (!botChat) {
          try {
            /** Start Bot if no chat found */
            await this.startBot({
              entity: parsed.entity,
              startParam,
            });
          } catch (error) {
            /** A silent bot still received /start */
            if (error?.message !== "TIMEOUT") throw error;
          }
        }

        /** Fetch Messages with Buttons */
        const messages = await this.getMessages(parsed.entity, {
          limit: 20,
        });
        const messagesWithButtons = messages.filter((msg) => {
          return msg.buttonCount > 0;
        });

        const buttons = messagesWithButtons.flatMap((msg) =>
          msg.buttons.flat().map((button) => button.button || button),
        );

        for (const button of buttons) {
          const url = button.url;

          /** Mini App Link */
          if (isBotMiniAppLink(url)) {
            const parsedButtonUrl = parseTelegramLink(url);
            if (parsedButtonUrl?.entity?.toLowerCase() === entityKey) {
              miniApp = parsedButtonUrl;
              break;
            }
          } else if (
            /** Webview Button */
            button instanceof Api.KeyboardButtonWebView ||
            button instanceof Api.KeyboardButtonSimpleWebView
          ) {
            webview = {
              url: url,
              type:
                button instanceof Api.KeyboardButtonWebView
                  ? "webview"
                  : "simple-webview",
            };
            break;
          }
        }

        /** Menu Button Webview */
        if (!webview && !miniApp) {
          webview = await this._getMenuButtonWebview(parsed.entity);
        }

        /** Cache Webview */
        if (webview || miniApp) {
          this.webviewCache.set(cacheKey, {
            webview,
            miniApp,
          });
        }
      }

      /** Request Webview */
      if (webview) {
        result = await this.invoke(
          webview.type === "simple-webview"
            ? new Api.messages.RequestSimpleWebView({
                platform: DEFAULT_WEB_APP_PLATFORM,
                bot: parsed.entity,
                url: webview.url,
                startParam,
                themeParams,
              })
            : new Api.messages.RequestWebView({
                platform: DEFAULT_WEB_APP_PLATFORM,
                fromBotMenu: webview.type === "menu",
                bot: parsed.entity,
                peer: parsed.entity,
                url: webview.url,
                startParam,
                themeParams,
              }),
        );
      } else if (miniApp) {
        /** Mini App Webview */
        result = await this.invoke(
          new Api.messages.RequestAppWebView({
            platform: DEFAULT_WEB_APP_PLATFORM,
            peer: miniApp.entity,
            app: new Api.InputBotAppShortName({
              botId: await this.getInputEntity(miniApp.entity),
              shortName: miniApp.shortName,
            }),
            startParam,
            themeParams,
          }),
        );
      } else {
        /** Main Webview */
        result = await this.invoke(
          new Api.messages.RequestMainWebView({
            platform: DEFAULT_WEB_APP_PLATFORM,
            bot: parsed.entity,
            peer: parsed.entity,
            startParam,
            themeParams,
          }),
        );
      }

      return result;
    });
  }

  /** Get Telegram WebApp */
  async getTelegramWebApp(link, options) {
    const webview = await this.getWebview(link, options);
    const result = extractTgWebAppData(webview.url);

    return result;
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return this.execute(async () => {
      try {
        const parsed = parseTelegramLink(link);

        await this.invoke(
          parsed.entity.startsWith("+")
            ? new Api.messages.ImportChatInvite({
                hash: parsed.entity.replace("+", ""),
              })
            : new Api.channels.JoinChannel({
                channel: parsed.entity,
              }),
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

  /** Get own name, username and bio */
  getFullProfile() {
    return this.execute(async () => {
      const me = await this.getMe();
      const { fullUser } = await this.invoke(
        new Api.users.GetFullUser({ id: new Api.InputUserSelf() }),
      );

      return {
        firstName: me.firstName || "",
        lastName: me.lastName || "",
        username: me.username || "",
        about: fullUser.about || "",
        premium: Boolean(me.premium),
      };
    });
  }

  /** Update Profile */
  updateProfile(options) {
    return this.execute(() => {
      return this.invoke(new Api.account.UpdateProfile(options));
    });
  }

  /** Update Username (empty string removes it) */
  updateUsername(username) {
    return this.execute(() => {
      return this.invoke(new Api.account.UpdateUsername({ username }));
    });
  }

  /** Get 2FA State */
  getPasswordState() {
    return this.execute(() => this.invoke(new Api.account.GetPassword()));
  }

  /** Update 2FA (no newPassword removes it) */
  updateTwoFa({ currentPassword, newPassword, hint }) {
    return this.execute(() =>
      this.updateTwoFaSettings({ currentPassword, newPassword, hint }),
    );
  }

  /** Get the devices signed in to this account */
  getAuthorizations() {
    return this.execute(async () => {
      const result = await this.invoke(new Api.account.GetAuthorizations());
      return result.authorizations;
    });
  }

  /** Terminate one device by its hash */
  terminateAuthorization(hash) {
    return this.execute(() =>
      this.invoke(new Api.account.ResetAuthorization({ hash })),
    );
  }

  /** Terminate every device except this one */
  terminateOtherAuthorizations() {
    return this.execute(() => this.invoke(new Api.auth.ResetAuthorizations()));
  }

  /** Delete a chat's whole history, batch by batch */
  deleteHistory(peer, { revoke = false } = {}) {
    return this.execute(async () => {
      let offset;

      do {
        const result = await this.invoke(
          new Api.messages.DeleteHistory({ peer, revoke, maxId: 0 }),
        );
        offset = result.offset;
      } while (offset > 0);
    });
  }

  /** Remove a dialog: leave a channel or group, delete a private chat */
  removeDialog(dialog, { block = false } = {}) {
    return this.execute(async () => {
      const entity = dialog.entity;

      /** Channel or supergroup */
      if (entity instanceof Api.Channel) {
        await this.invoke(new Api.channels.LeaveChannel({ channel: entity }));
        return;
      }

      /** Leave a basic group still joined */
      if (entity instanceof Api.Chat && !entity.left && !entity.deactivated) {
        await this.invoke(
          new Api.messages.DeleteChatUser({
            chatId: entity.id,
            userId: new Api.InputUserSelf(),
          }),
        );
      }

      /** Drop the basic group from the list */
      if (!(entity instanceof Api.User)) {
        await this.deleteHistory(entity);
        return;
      }

      /** Private chat or bot */
      await this.deleteHistory(entity, { revoke: true });

      /** Block it */
      if (block) {
        await this.invoke(new Api.contacts.Block({ id: entity }));
      }
    });
  }

  /** Delete every saved contact */
  deleteAllContacts() {
    return this.execute(async () => {
      const result = await this.invoke(
        new Api.contacts.GetContacts({ hash: 0 }),
      );
      const users = result.users ?? [];

      /** Delete them in one request */
      if (users.length > 0) {
        await this.invoke(new Api.contacts.DeleteContacts({ id: users }));
      }

      return users.length;
    });
  }

  /** Unblock every blocked user and chat */
  unblockAll() {
    return this.execute(async () => {
      const limit = 100;
      const peers = [];

      /** Collect the whole block list page by page */
      while (true) {
        const result = await this.invoke(
          new Api.contacts.GetBlocked({ offset: peers.length, limit }),
        );
        peers.push(...result.blocked.map((item) => item.peerId));

        if (result.blocked.length < limit) break;
      }

      /** Unblock each one */
      for (const peer of peers) {
        await this.invoke(new Api.contacts.Unblock({ id: peer }));
      }

      return peers.length;
    });
  }

  /** Logout */
  logout() {
    return this.execute(() => this.invoke(new Api.auth.LogOut({})));
  }
}
