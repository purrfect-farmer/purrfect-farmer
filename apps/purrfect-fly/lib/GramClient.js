import BaseTelegramWebClient from "@purrfect/shared/lib/BaseTelegramWebClient.js";
import fsp from "node:fs/promises";
import path from "node:path";
import { Api, Logger } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { globby } from "globby";

import { getCurrentPath } from "./path.js";

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
  constructor(name, session, sessionFilePath, sessionFileExists) {
    super(session, {
      deviceModel: DEVICE_MODEL,
      systemVersion: SYSTEM_VERSION,
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

  /** Start Handler */
  _createStartHandler(stage) {
    return () =>
      new Promise((resolve) => {
        /** Resolve Stage Promise */
        this._startStagePromise?.resolve?.({
          stage,
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
    };
  }

  /** Reset Destroy Timeout */
  _resetDestroyTimeout() {
    clearTimeout(this._destroyTimeout);
    this._destroyTimeout = setTimeout(() => this.destroy(), 1 * 60 * 1000);
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
              error
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
            console.error(error);

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
      console.error(error);
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
    await fsp.writeFile(
      this._sessionFilePath,
      JSON.stringify(this.session.save())
    );

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
   * @returns {GramClient}
   */
  static async create(name) {
    if (this.instances.has(name)) return this.instances.get(name);

    const sessionFilePath = await this.getSessionPath(name);
    const sessionFileExists = await this.sessionFileExists(name);

    const sessionData = sessionFileExists
      ? JSON.parse(await fsp.readFile(sessionFilePath))
      : "";

    const stringSession = new StringSession(sessionData);

    return this.instances
      .set(
        name,
        new this(name, stringSession, sessionFilePath, sessionFileExists)
      )
      .get(name);
  }

  /** Get Sessions */
  static async getSessions() {
    const entries = await globby([path.join(this.getStoragePath(), "*.json")]);

    const sessions = entries.map(
      (item) => path.basename(item, ".json").split("_")[1]
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
}

export default GramClient;
