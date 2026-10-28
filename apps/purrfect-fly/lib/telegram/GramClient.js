import { Api, Logger } from "telegram";
import {
  getSessionPath,
  readSession,
  sessionFileExists,
  writeSession,
} from "./session-store.js";

import BaseTelegramWebClient from "@purrfect/shared/lib/BaseTelegramWebClient.js";
import LoginFlow from "./LoginFlow.js";
import {
  TELEGRAM_DEVICE_MODEL,
  TELEGRAM_SYSTEM_VERSION,
} from "@purrfect/shared/utils/telegramClient.js";
import { cloneSession } from "./clone-session.js";
import fsp from "node:fs/promises";
import { parseProxy } from "./parse-proxy.js";

/** An idle client is destroyed after this long */
const IDLE_TIMEOUT = 15 * 60 * 1000;

class GramClient extends BaseTelegramWebClient {
  /**
   * @type {Map<string, GramClient>}
   */
  static instances = new Map();

  /**
   * @type {Map<string, Promise<GramClient>>}
   */
  static pending = new Map();

  constructor({ name, session, proxy, sessionFilePath, sessionFileExists }) {
    super(session, {
      deviceModel: TELEGRAM_DEVICE_MODEL,
      systemVersion: TELEGRAM_SYSTEM_VERSION,
      proxy,
      ...(process.env.NODE_ENV === "production" && {
        baseLogger: new Logger("error"),
      }),
    });

    this._name = name;
    this._sessionFilePath = sessionFilePath;
    this._sessionFileExists = sessionFileExists;
    this._destroyTimeout = null;
    this._login = new LoginFlow(this);
  }

  /** Restart the idle countdown */
  _resetDestroyTimeout() {
    clearTimeout(this._destroyTimeout);
    this._destroyTimeout = setTimeout(() => {
      this.destroy().catch((error) => {
        console.error("Error while destroying idle client:", error);
      });
    }, IDLE_TIMEOUT);
  }

  /** Execute on Client */
  async execute(callback) {
    this._resetDestroyTimeout();

    return super.execute(callback);
  }

  /** Destroy */
  destroy() {
    this._login.clearTimeout();
    clearTimeout(this._destroyTimeout);

    /** Evict so the next create starts a fresh client */
    if (this.constructor.instances.get(this._name) === this) {
      this.constructor.delete(this._name);
    }

    return super.destroy();
  }

  /** Answer the current login stage */
  startResponse(stage, response) {
    return this._login.respond(stage, response);
  }

  /** Start a phone login, resolving with its first stage */
  startPending() {
    return this._login.startWithPhone();
  }

  /** Start a login-token login, resolving with the token to accept */
  startTokenPending() {
    return this._login.startWithToken();
  }

  /** Join Telegram links one at a time */
  async joinTelegramLink(link) {
    this._joinQueue = this._joinQueue || Promise.resolve();
    this._joinQueue = this._joinQueue.then(() => super.joinTelegramLink(link));

    return this._joinQueue;
  }

  /** Log out, then drop the session file and this instance */
  async logout() {
    try {
      if (this.disconnected) {
        await this.connect();
      }

      await this.invoke(new Api.auth.LogOut({}));
      await this.destroy();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      this._login.reject(new Error("Logged Out!"));

      await this._deleteSession();

      this.constructor.delete(this._name);
    }
  }

  /** Write the current session to its file */
  async saveSession() {
    await writeSession(this._name, this.session.save());

    this._sessionFileExists = true;
  }

  /** Delete Session */
  async _deleteSession() {
    if (this._sessionFileExists) {
      await fsp.unlink(this._sessionFilePath);
    }

    this._sessionFileExists = false;
  }

  /**
   * Starts a Client
   * @param {string} name
   * @param {string|null} proxy
   * @returns {Promise<GramClient>}
   */
  static async create(name, proxy = null) {
    if (this.instances.has(name)) return this.instances.get(name);

    /** Concurrent calls for one name share a single client */
    if (!this.pending.has(name)) {
      const creation = this._createInstance(name, proxy).finally(() => {
        this.pending.delete(name);
      });

      this.pending.set(name, creation);
    }

    return this.pending.get(name);
  }

  /** Build a client from its session file and register it */
  static async _createInstance(name, proxy) {
    const client = new this({
      name,
      session: await readSession(name),
      proxy: parseProxy(proxy),
      sessionFilePath: getSessionPath(name),
      sessionFileExists: await sessionFileExists(name),
    });

    this.instances.set(name, client);

    return client;
  }

  /** Delete Instance */
  static delete(name) {
    this.instances.delete(name);
  }

  /**
   * Create an ephemeral client (not tracked, no session file backing) from a
   * raw StringSession. Used for session cloning.
   *
   * @param {string} sessionString
   * @param {string|null} proxy
   * @returns {GramClient}
   */
  static createRaw(sessionString = "", proxy = null) {
    return new this({
      name: null,
      session: sessionString,
      proxy: parseProxy(proxy),
      sessionFilePath: null,
      sessionFileExists: false,
    });
  }

  /** Mint a new independent session from an authorized one */
  static cloneSession(sessionString, options) {
    return cloneSession(this, sessionString, options);
  }
}

export default GramClient;
