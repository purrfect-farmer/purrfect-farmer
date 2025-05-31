import EventEmitter from "events";
import TelegramWorker from "@/lib/telegram-worker?worker";

import { uuid } from "./utils";

export default class TelegramWorkerClient {
  constructor(session) {
    this.emitter = new EventEmitter();
    this.handlers = {
      phone: null,
      code: null,
      password: null,
      error: null,
    };
    this.connected = false;

    /** @type {Worker} */
    this.worker = new TelegramWorker();
    this.worker.addEventListener("message", (ev) => {
      const { id, action, data } = ev.data;

      switch (action) {
        case "handler-phone":
        case "handler-code":
        case "handler-password":
        case "handler-error":
          const handler = this.handlers[action.split("-")[1]];
          if (handler) {
            handler(data);
          }
          break;
        case "update-connection-state":
          this.connected = data;
          this.emitter.emit("update-connection-state", this.connected);
          break;

        default:
          if (id) {
            this.emitter.emit(id, data);
          }
      }
    });

    this.message("initialize-client", session);
  }

  /** Create Handler */
  createHandler(name, callback) {
    this.handlers[name] = async (response) => {
      try {
        const result = await callback(response);
        this.worker.postMessage({
          action: "handler-" + name,
          data: {
            result,
          },
        });
      } catch (error) {
        this.worker.postMessage({
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
    this.createHandler("phone", options.phoneNumber);
    this.createHandler("code", options.phoneCode);
    this.createHandler("password", options.password);
    this.createHandler("error", options.onError);

    return this.message("start-client");
  }

  /** Send Message */
  message(action, data) {
    return new Promise((resolve, reject) => {
      const id = uuid();

      this.emitter.once(id, (data) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result);
        }
      });

      this.worker.postMessage({
        id,
        action,
        data,
      });
    });
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
  connect() {
    return this.message("connect");
  }

  /** Disconnect */
  disconnect() {
    return this.message("disconnect");
  }

  /** Logout */
  logout() {
    return this.message("logout");
  }

  /** Is User Authorized */
  isUserAuthorized() {
    return this.message("is-user-authorized");
  }

  /** Get Connection State */
  getConnectionState() {
    return this.message("get-connection-state");
  }

  /** Destroy */
  destroy() {
    this.worker.terminate();
  }

  /** Start Bot from Link */
  startBotFromLink(options) {
    return this.message("start-bot-from-link", options);
  }

  /** Get Webview */
  getWebview(link) {
    return this.message("get-webview", link);
  }

  /** Get Telegram WebApp */
  getTelegramWebApp(link) {
    return this.message("get-telegram-web-app", link);
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return this.message("join-telegram-link", link);
  }
}
