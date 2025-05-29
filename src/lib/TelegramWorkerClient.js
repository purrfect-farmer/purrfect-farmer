import EventEmitter from "events";
import TelegramWorker from "@/lib/telegram-worker?worker";

import { uuid } from "./utils";

export default class TelegramWorkerClient {
  constructor(session) {
    this.connected = false;
    this.emitter = new EventEmitter();

    /** @type {Worker} */
    this.worker = new TelegramWorker();
    this.worker.addEventListener("message", (ev) => {
      const { id, action, data } = ev.data;

      switch (action) {
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
