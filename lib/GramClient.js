const fs = require("node:fs/promises");
const path = require("node:path");
const { Api, TelegramClient, Logger } = require("telegram");
const { StringSession } = require("telegram/sessions/index.js");
const { globby } = require("globby");
const utils = require("./utils");

const config = {
  apiId: 2496,
  apiHash: "8da85b0d5bfe62527e5b244c209159c3",
  appVersion: "2.2 K",
  deviceModel:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  systemVersion: "Linux x86_64",
  systemLangCode: "en-US",
  langCode: "en",
};

class GramClient extends TelegramClient {
  /**
   * @type {Map<string, GramClient>}
   */
  static instances = new Map();

  /** Constructor */
  constructor(name, session, sessionFilePath, sessionFileExists) {
    super(session, config.apiId, config.apiHash, {
      connectionRetries: 5,
      appVersion: config.appVersion,
      deviceModel: config.deviceModel,
      systemVersion: config.systemVersion,
      systemLangCode: config.systemLangCode,
      langCode: config.langCode,
      ...(process.env.NODE_ENV === "production" && {
        baseLogger: new Logger("error"),
      }),
    });

    /** Connection Queue */
    this._connectionQueue = [];

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

    /** Is Connecting */
    this._isConnecting = false;

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
  async _execute(callback) {
    /** Reset Destroy Timeout */
    this._resetDestroyTimeout();

    /** Ensure to Connect */
    await this.connect();

    /** Delay */
    await utils.delayForSeconds(Math.floor(Math.random() * 5));

    /** Execute Callback */
    return callback();
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

  /** Get Self */
  getSelf() {
    return this._execute(async () => {
      try {
        return await this.getMe();
      } catch (error) {
        console.error(error);
        return null;
      }
    });
  }

  /** Get Webview */
  webview(link) {
    return this._execute(async () => {
      const parsed = utils.parseTelegramLink(link);

      /** Theme Params */
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

      /** Get WebView */
      return await this.invoke(
        parsed.shortName
          ? new Api.messages.RequestAppWebView({
              themeParams,
              platform: "android",
              peer: parsed.entity,
              startParam: parsed.startParam,
              app: new Api.InputBotAppShortName({
                botId: await this.getInputEntity(parsed.entity),
                shortName: parsed.shortName,
              }),
            })
          : new Api.messages.RequestMainWebView({
              themeParams,
              platform: "android",
              bot: parsed.entity,
              peer: parsed.entity,
              startParam: parsed.startParam,
            })
      );
    });
  }

  /** Join Telegram Link */
  async joinTelegramLink(link) {
    const parsed = utils.parseTelegramLink(link);

    /** Delay */
    await utils.delayForMinutes(Math.floor(Math.random() * 5));

    return this._execute(async () => {
      try {
        await this.invoke(
          parsed.entity.startsWith("+")
            ? new Api.messages.ImportChatInvite({
                hash: parsed.entity.replace("+", ""),
              })
            : new Api.channels.JoinChannel({
                channel: parsed.entity,
              })
        );
      } catch (error) {
        if (
          typeof error === "string" &&
          !error.includes("USER_ALREADY_PARTICIPANT") &&
          !error.includes("INVITE_REQUEST_SENT")
        ) {
          return false;
        }
      }

      return true;
    });
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
      await GramClient.delete(this._name);
    }
  }

  /** Save Session */
  async _saveSession() {
    /** Write to File */
    await fs.writeFile(
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
      await fs.unlink(this._sessionFilePath);
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

    const sessionFilePath = await GramClient.getSessionPath(name);
    const sessionFileExists = await GramClient.sessionFileExists(name);

    const sessionData = sessionFileExists
      ? JSON.parse(await fs.readFile(sessionFilePath))
      : "";

    const stringSession = new StringSession(sessionData);

    return this.instances
      .set(
        name,
        new GramClient(name, stringSession, sessionFilePath, sessionFileExists)
      )
      .get(name);
  }

  /** Get Sessions */
  static async getSessions() {
    const entries = await globby([
      path.join(GramClient.getStoragePath(), "*.json"),
    ]);

    const sessions = entries.map(
      (item) => path.basename(item, ".json").split("_")[1]
    );

    return sessions;
  }

  /** Check if session exists */
  static async sessionExists(name) {
    return GramClient.instances.has(name) || GramClient.sessionFileExists(name);
  }

  /** Check if session file exists */
  static async sessionFileExists(name) {
    return await fs
      .access(GramClient.getSessionPath(name))
      .then(() => true)
      .catch(() => false);
  }

  /** Get session file path */
  static getSessionPath(name) {
    return path.join(GramClient.getStoragePath(), `session_${name}.json`);
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

module.exports = GramClient;
