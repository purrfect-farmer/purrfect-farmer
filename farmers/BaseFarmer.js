const { default: axios } = require("axios");
const HttpsProxyAgent = require("https-proxy-agent");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const seedrandom = require("seedrandom");

const db = require("../db/models");
const GramClient = require("../lib/GramClient");
const userAgents = require("../lib/userAgents");
const utils = require("../lib/utils");
const bot = require("../lib/bot");

class BaseFarmer {
  static _isRunning = false;

  constructor(config, farmer) {
    this.config = config;
    this.farmer = farmer;

    this.random = seedrandom(this.farmer.account.id);
    this.userAgent = userAgents[Math.floor(this.random() * userAgents.length)];

    this.proxyAgent = this.farmer.account.proxy
      ? new HttpsProxyAgent("http://" + this.farmer.account.proxy)
      : null;
    this.jar = new CookieJar();
    this.api = wrapper(
      axios.create({
        timeout: 60_000,
        httpsAgent: this.proxyAgent,
        httpAgent: this.proxyAgent,
        proxy: false,
        jar: this.jar,
        headers: {
          common: {
            ["User-Agent"]: this.userAgent,
            ["Origin"]: this.constructor.origin,
            ["Referer"]: this.constructor.origin + "/",
            ["Referrer-Policy"]: "strict-origin-when-cross-origin",
            ["Cache-Control"]: "no-cache",
            ["X-Requested-With"]: "org.telegram.messenger",
          },
        },
      })
    );

    /** Apply Delay */
    this.api.interceptors.request.use((config) =>
      this.constructor.delay
        ? new Promise((resolve) =>
            setTimeout(resolve, this.constructor.delay * 1000, config)
          )
        : config
    );

    /** Set Headers */
    this.api.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        ...this.farmer.headers,
        ...this.getExtraHeaders?.(),
      };
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          [401, 403, 418].includes(error?.response?.status) &&
          !originalRequest._retry &&
          typeof this.setAuth === "function"
        ) {
          try {
            await this.setAuth();
            await this.farmer.save();

            originalRequest._retry = true;
            originalRequest.headers = {
              ...originalRequest.headers,
              ...this.farmer.headers,
              ...this.getExtraHeaders?.(),
            };

            return this.api.request(originalRequest);
          } catch (e) {
            console.error("Failed to refresh auth:", e);

            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async init() {
    /** Update WebAppData */
    if (this.farmer.account.session) {
      this.client = await GramClient.create(this.farmer.account.session);
      await this.client.connect();
      await this.updateWebAppData();
    }

    /** Set Auth */
    if (this.constructor.shouldSetAuth) {
      await this.setAuth();
    }

    /** Save Farmer */
    if (this.farmer.changed()) {
      await this.farmer.save();
    }

    return this;
  }

  async updateWebAppData() {
    const { entity, shortName, startParam } = utils.parseTelegramLink(
      this.config.telegramLink
    );
    const { url } = await this.client.webview({
      bot: entity,
      shortName,
      startParam,
    });

    const { initData } = utils.extractTgWebAppData(url);

    this.farmer.initData = initData;
  }

  async disconnect() {
    try {
      if (!this.farmer.account.session) {
        this.farmer.active = false;
        await this.farmer.save();
      }
    } catch (e) {
      this.constructor.error("Error:", e);
    }
  }

  async process() {
    throw new Error("process() must be implemented by subclass");
  }

  static log(msg, ...args) {
    console.log(`[${this.name}] ${msg}`, ...args);
  }

  static error(msg, ...args) {
    console.error(`[${this.name}] ${msg}`, ...args);
  }

  static async farm(config, farmer) {
    const instance = new this(config, farmer);

    try {
      await instance.init();
      await instance.process();
    } catch (e) {
      await instance.disconnect();
      this.error("Error:", e);
    }
  }

  static async run(config) {
    this.log("Starting Farmer");

    /** Currently Running */
    if (this._isRunning) {
      this.log("Skipping run because previous run is still in progress.");
      return;
    }

    /** Mark as Running */
    this._isRunning = true;

    try {
      /** Start Date */
      const startDate = new Date();

      /** Retrieve active farmers */
      const farmers = await db.Farmer.findAllWithActiveSubscription({
        where: {
          farmer: config.id,
          active: true,
        },
      });

      /** Run all farmer */
      await Promise.allSettled(
        farmers.map((farmer) => this.farm(config, farmer))
      );

      /** Send Farming Complete Message */
      await bot.sendFarmingCompleteMessage({
        config,
        farmers: await db.Farmer.findAllWithActiveSubscription({
          where: {
            farmer: config.id,
          },
        }),
        startDate,
        endDate: new Date(),
      });
    } catch (err) {
      this.error("Error during run:", err);
    } finally {
      this._isRunning = false;
      this.log("Completed Farming!");
    }
  }
}

module.exports = BaseFarmer;
