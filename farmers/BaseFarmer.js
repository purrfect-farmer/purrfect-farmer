const { default: axios, isAxiosError } = require("axios");
const { CookieJar } = require("tough-cookie");
const seedrandom = require("seedrandom");

const db = require("../db/models");
const GramClient = require("../lib/GramClient");
const userAgents = require("../lib/userAgents");
const bot = require("../lib/bot");
const {
  createCookieAgent,
  HttpCookieAgent,
  HttpsCookieAgent,
} = require("http-cookie-agent/http");
const { default: chalk } = require("chalk");
const { HttpProxyAgent, HttpsProxyAgent } = require("hpagent");

const HttpProxyAgentWithCookies = createCookieAgent(HttpProxyAgent);
const HttpsProxyAgentWithCookies = createCookieAgent(HttpsProxyAgent);

class BaseFarmer {
  static runners = new Map();

  constructor(farmer, config) {
    this.farmer = farmer;
    this.config = config;
    this.utils = require("../lib/utils");

    this.cookies = this.constructor.cookies;
    this.random = seedrandom(this.farmer.account.id);
    this.userAgent = userAgents[Math.floor(this.random() * userAgents.length)];
    this.jar = this.cookies ? new CookieJar() : null;

    /** Proxy URL */
    this.proxy = this.farmer.account.proxy
      ? `http://${this.farmer.account.proxy}`
      : null;

    /** Agent */
    this.httpAgent = this.createAgent(this.proxy, false);
    this.httpsAgent = this.createAgent(this.proxy, true);

    /** Create API */
    this.api = axios.create({
      timeout: 60_000,
      httpAgent: this.httpAgent,
      httpsAgent: this.httpsAgent,
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
    });

    /** Apply Delay */
    this.api.interceptors.request.use(async (config) => {
      if (this.constructor.delay) {
        await this.utils.delayForSeconds(this.constructor.delay);
      }
      return config;
    });

    /** Set Headers */
    this.api.interceptors.request.use((config) => {
      /** Apply Headers */
      config.headers = {
        ...config.headers,
        ...this.farmer.headers,
        ...this.getExtraHeaders?.(),
      };
      return config;
    });

    /** Refetch Auth */
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          [401, 403, 418].includes(error?.response?.status) &&
          !originalRequest._retry &&
          !this._fetchingAuth &&
          typeof this.setAuth === "function"
        ) {
          try {
            this._fetchingAuth = true;
            await this.setAuth();
            await this.farmer.save();

            originalRequest._retry = true;
            originalRequest.headers = {
              ...originalRequest.headers,
              ...this.farmer.headers,
              ...this.getExtraHeaders?.(),
            };

            return this.api.request(originalRequest);
          } catch (error) {
            console.error("Failed to refresh auth:", error);
            return Promise.reject(error);
          } finally {
            this._fetchingAuth = false;
          }
        }

        return Promise.reject(error);
      }
    );

    /** Log API Response */
    if (process.env.NODE_ENV !== "production") {
      this.api.interceptors.response.use(
        (response) => {
          const url = response.config.url;
          const title = this.utils.truncateAndPad(this.farmer.account.id, 10);
          const status = this.utils.truncateAndPad(response.status, 3);
          const method = this.utils.truncateAndPad(
            response.config.method.toUpperCase(),
            4
          );

          /** Log to Console */
          console.log(
            `${chalk.bold.blue(`${title}`)} ${chalk.bold.cyan(
              `${method}`
            )} ${chalk.bold.green(`${status} ${url}`)}`
          );
          return response;
        },
        (error) => {
          const url = error.config.url;
          const title = this.utils.truncateAndPad(this.farmer.account.id, 10);
          const status = this.utils.truncateAndPad(
            error.response?.status ?? "ERR",
            3
          );
          const method = this.utils.truncateAndPad(
            error.config.method.toUpperCase(),
            4
          );

          /** Log to Console */
          console.log(
            `${chalk.bold.blue(`${title}`)} ${chalk.bold.cyan(
              `${method}`
            )} ${chalk.bold.red(`${status} ${url}`)}`
          );
          return Promise.reject(error);
        }
      );
    }

    /** Register extra interceptors */
    if (this.configureApi) {
      this.configureApi();
    }
  }

  createAgent(proxy, isHttps) {
    const proxyAgentType = isHttps ? HttpsProxyAgent : HttpProxyAgent;
    const cookieAgentType = isHttps
      ? HttpsProxyAgentWithCookies
      : HttpProxyAgentWithCookies;
    const defaultAgentType = isHttps ? HttpsCookieAgent : HttpCookieAgent;

    if (proxy) {
      return this.cookies
        ? new cookieAgentType({ proxy, cookies: { jar: this.jar } })
        : new proxyAgentType({ proxy });
    } else {
      return this.cookies
        ? new defaultAgentType({ cookies: { jar: this.jar } })
        : null;
    }
  }

  /** Log Task Error */
  logTaskError(task, error) {
    console.error(
      "Failed to complete task:",
      this.farmer.accountId,
      task,
      this.wrapError(error)
    );
  }

  /** Wrap Error */
  wrapError(error) {
    return isAxiosError(error)
      ? error.response?.data || error.message
      : error.message;
  }

  /** Validate Telegram Task */
  validateTelegramTask(link) {
    return !this.utils.isTelegramLink(link) || this.canJoinTelegramLink(link);
  }

  /** Can Join Telegram Link */
  canJoinTelegramLink(link) {
    return this.utils.canJoinTelegramLink(link) && Boolean(this.client);
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return this.client.joinTelegramLink(link);
  }

  /** Try to join Telegram Link */
  async tryToJoinTelegramLink(link) {
    if (this.canJoinTelegramLink(link)) {
      try {
        await this.joinTelegramLink(link);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async init() {
    /** Update WebAppData */
    if (this.farmer.account.session) {
      try {
        this.client = await GramClient.create(this.farmer.account.session);
        await this.client.connect();
        await this.updateWebAppData();
      } catch {
        console.error("Failed to update WebAppData");
      }
    }

    /** Set Auth */
    if (this.constructor.auth) {
      await this.setAuth();
    }

    /** Save Farmer */
    if (this.farmer.changed()) {
      await this.farmer.save();
    }

    return this;
  }

  async updateWebAppData() {
    const { url } = await this.client.webview(this.config.telegramLink);
    const { initData } = this.utils.extractTgWebAppData(url);

    this.farmer.initData = initData;
  }

  async disconnect() {
    try {
      if (!this.farmer.account.session) {
        this.farmer.active = false;
        await this.farmer.save();
      }
    } catch (error) {
      this.constructor.error("Error:", error);
    }
  }

  async process() {
    throw new Error("process() must be implemented by subclass");
  }

  static log(msg, ...args) {
    console.log(`[${this.title}] ${msg}`, ...args);
  }

  static error(msg, ...args) {
    console.error(`[${this.title}] ${msg}`, ...args);
  }

  static async execute(farmer, config) {
    const instance = new this(farmer, config);

    try {
      await instance.init();
      await instance.process();
    } catch (error) {
      await instance.disconnect();
      this.error(
        "Error:",
        farmer.accountId,
        isAxiosError(error)
          ? error?.response?.data || error.message
          : error.message
      );
    } finally {
      this.runners.delete(farmer.accountId);
    }
  }

  static async farm(farmer, config) {
    if (!this.runners.has(farmer.accountId)) {
      this.runners.set(farmer.accountId, this.execute(farmer, config));
    }
    return this.runners.get(farmer.accountId);
  }

  static async run(config) {
    try {
      /** Retrieve active farmers */
      const farmers = await db.Farmer.findAllWithActiveSubscription({
        where: {
          farmer: this.id,
        },
      });

      /** Run all farmer */
      farmers
        .filter((item) => item.active)
        .map((farmer) => this.farm(farmer, config));

      /** Send Farming Complete Message */
      try {
        await bot?.sendFarmingInitiatedMessage({
          id: this.id,
          title: this.title,
          farmers,
          config,
        });
      } catch (error) {
        this.error("Failed to send farming notification:", error);
      }
    } catch (error) {
      this.error("Error during run:", error);
    } finally {
      this.log("Completed Farming!");
    }
  }
}

module.exports = BaseFarmer;
