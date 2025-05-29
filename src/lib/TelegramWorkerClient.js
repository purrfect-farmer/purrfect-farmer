import EventEmitter from "events";
import TelegramWorker from "@/lib/telegram-worker?worker";

import { uuid } from "./utils";

export default class TelegramWorkerClient {
  constructor(session) {
    this.connected = false;
    this.handlers = {
      phone: null,
      code: null,
      password: null,
      error: null,
    };
    this.emitter = new EventEmitter();

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

  start(options) {
    this.createHandler("phone", options.phoneNumber);
    this.createHandler("code", options.phoneCode);
    this.createHandler("password", options.password);
    this.createHandler("error", options.onError);

    return this.message("start-client");
  }

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

  connect() {
    return this.message("connect");
  }

  disconnect() {
    return this.message("disconnect");
  }

  logout() {
    return this.message("logout");
  }

  isUserAuthorized() {
    return this.message("is-user-authorized");
  }

  getConnectionState() {
    return this.message("get-connection-state");
  }

  destroy() {
    this.worker.terminate();
  }

  addEventListener(event, callback) {
    return this.emitter.addListener(event, callback);
  }
  removeEventListener(event, callback) {
    return this.emitter.removeListener(event, callback);
  }
}
