import EventEmitter from "events";
import TelegramWorker from "@/lib/telegram-worker?worker";

import { uuid } from "./utils";

export default class TelegramWorkerClient {
  constructor(session) {
    this._emitter = new EventEmitter();
    this._handlers = {
      phone: null,
      code: null,
      password: null,
      error: null,
    };

    this._connected = false;
    this._isAuthorized = false;

    /** @type {Worker} */
    this._worker = new TelegramWorker();
    this._worker.addEventListener("message", (ev) => {
      const { id, action, data } = ev.data;

      switch (action) {
        case "handler-phone":
        case "handler-code":
        case "handler-password":
        case "handler-error":
          const handler = this._handlers[action.split("-")[1]];
          if (handler) {
            handler(data);
          }
          break;
        case "update-connection-state":
        case "user-is-authorized":
          if (action === "update-connection-state") {
            this._connected = data;
          } else {
            this._isAuthorized = data;
          }
          this._emitter.emit(action, data);
          break;

        default:
          if (id) {
            this._emitter.emit(id, data);
          }
      }
    });

    /** Initialize Client */
    this._message("initialize-client", session);
  }

  /** Get Connected State */
  get connected() {
    return this._connected;
  }

  /** Get Authorized State */
  get authorized() {
    return this._isAuthorized;
  }

  /** Create Handler */
  _createHandler(name, callback) {
    this._handlers[name] = async (response) => {
      try {
        const result = await callback(response);
        this._worker.postMessage({
          action: "handler-" + name,
          data: {
            result,
          },
        });
      } catch (error) {
        this._worker.postMessage({
          action: "handler-" + name,
          data: {
            error: { message: error?.message || "An error occurred!" },
          },
        });
      }
    };
  }

  /** Start */
  start(options) {
    this._createHandler("phone", options.phoneNumber);
    this._createHandler("code", options.phoneCode);
    this._createHandler("password", options.password);
    this._createHandler("error", options.onError);

    return this._message("start-client");
  }

  /** Send Message */
  _message(action, data) {
    return new Promise((resolve, reject) => {
      const id = uuid();

      this._emitter.once(id, (data) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result);
        }
      });

      this._worker.postMessage({
        id,
        action,
        data,
      });
    });
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

  /** Connect */
  connect() {
    return this._message("connect");
  }

  /** Disconnect */
  disconnect() {
    return this._message("disconnect");
  }

  /** Logout */
  logout() {
    return this._message("logout");
  }

  /** Is User Authorized */
  isUserAuthorized() {
    return this._message("is-user-authorized");
  }

  /** Get Connection State */
  getConnectionState() {
    return this._message("get-connection-state");
  }

  /** Destroy */
  destroy() {
    this._worker.terminate();
  }

  /** Start Bot from Link */
  startBotFromLink(options) {
    return this._message("start-bot-from-link", options);
  }

  /** Get Webview */
  getWebview(link) {
    return this._message("get-webview", link);
  }

  /** Get Telegram WebApp */
  getTelegramWebApp(link) {
    return this._message("get-telegram-web-app", link);
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return this._message("join-telegram-link", link);
  }
}
