import { Api, Logger } from "telegram";
import {
  acceptLoginToken,
  finalizeLoginToken,
  requestLoginToken,
} from "@purrfect/shared/utils/loginToken.js";

import BaseTelegramWebClient from "@purrfect/shared/lib/BaseTelegramWebClient.js";
import fsp from "node:fs/promises";
import { getCurrentPath } from "./path.js";
import { getDcDetails } from "@purrfect/shared/utils/dc.js";
import { globby } from "globby";
import path from "node:path";

const { __dirname } = getCurrentPath(import.meta.url);

const DEVICE_MODEL =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
const SYSTEM_VERSION = "Linux x86_64";

class GramClient extends BaseTelegramWebClient {
  /**
   * @type {Map<string, GramClient>}
   */
  static instances = new Map();

  /** Constructor */
  constructor({ name, session, proxy, sessionFilePath, sessionFileExists }) {
    super(session, {
      deviceModel: DEVICE_MODEL,
      systemVersion: SYSTEM_VERSION,
      proxy,
      ...(process.env.NODE_ENV === "production" && {
        baseLogger: new Logger("error"),
      }),
    });

    /** Store Name */
    this._name = name;

    /** Store File Path */
    this._sessionFilePath = sessionFilePath;

    /** Store Session File State */
    this._sessionFileExists = sessionFileExists;

    /** Destroy Timeout */
    this._destroyTimeout = null;

    /** Start Timeout */
    this._startTimeout = null;

    /** Initial Start Stage */
    this._resetStartStage();
  }

  /** Parse Proxy */
  static parseProxy(proxy) {
    if (!proxy) return null;

    const [creds, hostPort] = proxy.split("@");
    const [username, password] = creds.split(":");
    const [ip, port] = hostPort.split(":");

    return {
      ip,
      username,
      password,
      port: parseInt(port, 10),
      MTProxy: false,
      socksType: 5,
      timeout: 2,
    };
  }

  /** Start Handler */
  _createStartHandler(stage, extra = null) {
    return () =>
      new Promise((resolve) => {
        /** Resolve Stage Promise */
        this._startStagePromise?.resolve?.({
          stage,
          ...extra,
        });

        /** Remove Previous Handler */
        if (this._startStage) {
          delete this._startHandlers[this._startStage];
        }

        /** Set Stage */
        this._startStage = stage;

        /** Set Handler */
        this._startHandlers[stage] = (data) => {
          resolve(data);

          /** Return new promise for the next stage */
          return new Promise((_resolve, _reject) => {
            this._startStagePromise = {
              resolve: _resolve,
              reject: _reject,
            };
          });
        };
      });
  }

  _resetStartStage() {
    /** Reset Start Stage */
    this._startStage = null;

    /** Reset Start Stage Promise */
    this._startStagePromise = null;

    /** Reset Start Handlers */
    this._startHandlers = {
      phone: null,
      code: null,
      password: null,
      token: null,
    };
  }

  /** Reset Destroy Timeout */
  _resetDestroyTimeout() {
    clearTimeout(this._destroyTimeout);
    this._destroyTimeout = setTimeout(() => this.destroy(), 15 * 60 * 1000);
  }

  /** Execute on Client */
  async execute(callback) {
    /** Reset Destroy Timeout */
    this._resetDestroyTimeout();

    return super.execute(callback);
  }

  /** Destroy */
  destroy() {
    clearTimeout(this._startTimeout);
    clearTimeout(this._destroyTimeout);
    return super.destroy();
  }

  /** Start Response */
  async startResponse(stage, response) {
    if (this._startStage !== stage) {
      throw new Error("Invalid stage!");
    } else if (!this._startHandlers[stage]) {
      throw new Error("Missing stage handler!");
    } else {
      return await this._startHandlers[stage](response);
    }
  }

  /** Start Pending */
  startPending() {
    return new Promise((_resolve, _reject) => {
      /** Automatically Logout */
      this._startTimeout = setTimeout(() => this.logout(), 10 * 60 * 1000);

      /** Reset Start Stage */
      this._resetStartStage();

      /** Reset Start Stage Promise */
      this._startStagePromise = { resolve: _resolve, reject: _reject };

      /** Start */
      this.start({
        phoneNumber: this._createStartHandler("phone"),
        phoneCode: this._createStartHandler("code"),
        password: this._createStartHandler("password"),
        onError: (error) => {
          if (this._startStagePromise) {
            this._startStagePromise.reject(error);
          } else {
            console.error(
              "Error occurred before handler was initialized:",
              error,
            );
          }
        },
      })
        .then(async () => {
          try {
            /** Get User */
            const user = await this.getMe();

            await this._saveSession();
            await this.destroy();

            this._startStagePromise?.resolve?.({
              stage: "authenticated",
              user,
            });
          } catch (error) {
            /** Log Error */
            console.error("Error during authentication process:", error);

            /** Reject Error */
            this._startStagePromise?.reject?.(error);
          } finally {
            this._resetStartStage();
          }
        })
        .catch((error) => this._startStagePromise?.reject?.(error))
        .finally(() => {
          /** Clear Timeout */
          clearTimeout(this._startTimeout);
        });
    });
  }

  /**
   * Start Pending (Login Token)
   *
   * The login-token counterpart of `startPending`.
   */
  startTokenPending() {
    return new Promise((_resolve, _reject) => {
      /** Automatically Logout */
      this._startTimeout = setTimeout(() => this.logout(), 10 * 60 * 1000);

      /** Reset Start Stage */
      this._resetStartStage();

      /** Reset Start Stage Promise */
      this._startStagePromise = { resolve: _resolve, reject: _reject };

      (async () => {
        /** Connect */
        if (this.disconnected) {
          await this.connect();
        }

        /** Export Login Token */
        const exported = await requestLoginToken(this);

        /** Hand the token over and wait for the acceptance to be reported */
        await this._createStartHandler("token", {
          token: exported.token.toString("base64"),
        })();

        /** Collect the authorization (handling DC migration and 2FA) */
        await finalizeLoginToken(this, {
          getPassword: this._createStartHandler("password"),
        });

        /** Get User */
        const user = await this.getMe();

        await this._saveSession();
        await this.destroy();

        this._startStagePromise?.resolve?.({
          stage: "authenticated",
          user,
        });
      })()
        .catch((error) => {
          /** Log Error */
          console.error("Error during login token authentication:", error);

          /** Reject */
          this._startStagePromise?.reject?.(error);
        })
        .finally(() => {
          /** Reset Start Stage */
          this._resetStartStage();

          /** Clear Timeout */
          clearTimeout(this._startTimeout);
        });
    });
  }

  /** Join Telegram Link */
  async joinTelegramLink(link) {
    this._joinQueue = this._joinQueue || Promise.resolve();
    this._joinQueue = this._joinQueue.then(() => super.joinTelegramLink(link));

    return this._joinQueue;
  }

  /** Logout */
  async logout() {
    try {
      /** Try to reconnect */
      if (this.disconnected) {
        await this.connect();
      }

      /** Logout */
      await this.invoke(new Api.auth.LogOut({}));

      /** Destroy */
      await this.destroy();
    } catch (error) {
      /** Logout */
      console.error("Error during logout:", error);
    } finally {
      /** Reject */
      this._startStagePromise?.reject?.(new Error("Logged Out!"));

      /** Delete Session */
      await this._deleteSession();

      /** Remove Instance */
      await this.constructor.delete(this._name);
    }
  }

  /** Save Session */
  async _saveSession() {
    /** Write to File */
    await this.constructor.writeSession(this._name, this.session.save());

    /** Mark as Saved */
    this._sessionFileExists = true;
  }

  /** Delete Session */
  async _deleteSession() {
    /** Delete File */
    if (this._sessionFileExists) {
      await fsp.unlink(this._sessionFilePath);
    }

    /** Mark as Removed */
    this._sessionFileExists = false;
  }

  /**
   * Starts a Client
   * @param {string} name
   * @param {string|null} proxy
   * @returns {GramClient}
   */
  static async create(name, proxy = null) {
    if (this.instances.has(name)) return this.instances.get(name);

    const sessionFilePath = await this.getSessionPath(name);
    const sessionFileExists = await this.sessionFileExists(name);

    const session = sessionFileExists
      ? JSON.parse(await fsp.readFile(sessionFilePath))
      : "";

    return this.instances
      .set(
        name,
        new this({
          name,
          session,
          proxy: this.parseProxy(proxy),
          sessionFilePath,
          sessionFileExists,
        }),
      )
      .get(name);
  }

  /** Get Sessions */
  static async getSessions() {
    const entries = await globby([path.join(this.getStoragePath(), "*.json")]);

    const sessions = entries.map(
      (item) => path.basename(item, ".json").split("_")[1],
    );

    return sessions;
  }

  /** Check if session exists */
  static async sessionExists(name) {
    return this.instances.has(name) || this.sessionFileExists(name);
  }

  /** Check if session file exists */
  static async sessionFileExists(name) {
    return await fsp
      .access(this.getSessionPath(name))
      .then(() => true)
      .catch(() => false);
  }

  /** Write session */
  static writeSession(session, content) {
    return fsp.writeFile(this.getSessionPath(session), JSON.stringify(content));
  }

  /** Delete session file */
  static async deleteSessionFile(name) {
    if (await this.sessionFileExists(name)) {
      await fsp.unlink(this.getSessionPath(name));
    }
  }

  /** Get session file path */
  static getSessionPath(name) {
    return path.join(this.getStoragePath(), `session_${name}.json`);
  }

  /** Get storage directory for all sessions */
  static getStoragePath() {
    return path.resolve(__dirname, "../sessions");
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
      proxy: this.parseProxy(proxy),
      sessionFilePath: null,
      sessionFileExists: false,
    });
  }

  /**
   * Mint a brand-new, independent session from an existing authorized session
   * using the Telegram login-token (QR) flow. The imported session authorizes
   * the token so no phone/code is required; when the account has 2FA enabled,
   * each candidate password is tried until one succeeds.
   *
   * @param {string} sessionString - StringSession of an authorized account
   * @param {object} options
   * @param {string[]} [options.passwords] - Candidate 2FA passwords to try
   * @param {string|null} [options.proxy]
   * @returns {Promise<{ session: string, user: import("telegram").Api.User }>}
   */
  static async cloneSession(
    sessionString,
    { passwords = [], proxy = null } = {},
  ) {
    const source = this.createRaw(sessionString, proxy);
    const fresh = this.createRaw("", proxy);

    try {
      /**
       * The DC address embedded in a whiskers session may be unreachable from
       * the cloud, so reset it to the address the cloud resolves for that DC.
       */
      const dcId = source.session.dcId;
      if (dcId) {
        const info = await getDcDetails(dcId);
        source.session.setDC(info.id, info.ipAddress, info.port);
      }

      await source.connect();
      await fresh.connect();

      /** The imported session must be authorized to accept the token */
      if (!(await source.isUserAuthorized())) {
        throw new Error("Source session is not authorized");
      }

      /** Export a login token from the fresh (empty) client */
      const exported = await requestLoginToken(fresh);

      /** Accept the token using the authorized client (server-side QR scan) */
      await acceptLoginToken(source, exported.token);

      /** Finalize: obtain authorization (handling DC migration and 2FA) */
      await finalizeLoginToken(fresh, {
        getPassword: (attempt) => passwords[attempt] ?? null,
      });

      /** Persist the new session and fetch the user */
      const user = await fresh.getMe();
      const session = fresh.session.save();

      return { session, user };
    } finally {
      await source.destroy().catch(() => {});
      await fresh.destroy().catch(() => {});
    }
  }
}

export default GramClient;
