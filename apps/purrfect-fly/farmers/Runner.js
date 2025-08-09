import ConsoleLogger from "@purrfect/shared/lib/ConsoleLogger.js";
import axios from "axios";
import seedrandom from "seedrandom";
import userAgents from "@purrfect/shared/resources/userAgents.js";
import { CookieJar } from "tough-cookie";
import {
  HttpCookieAgent,
  HttpsCookieAgent,
  createCookieAgent,
} from "http-cookie-agent/http";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import GramClient from "../lib/GramClient.js";
import bot from "../lib/bot.js";
import db from "../db/models/index.js";
import utils from "../lib/utils.js";

const HttpProxyAgentWithCookies = createCookieAgent(HttpProxyAgent);
const HttpsProxyAgentWithCookies = createCookieAgent(HttpsProxyAgent);

/**
 * @param {import("@purrfect/shared/lib/BaseFarmer").default} FarmerClass
 */
export default function createRunner(FarmerClass) {
  return class Runner extends FarmerClass {
    static runners = new Map();
    static logger = new ConsoleLogger();
    static utils = utils;

    constructor(farmer, config) {
      super();
      this.farmer = farmer;
      this.config = config;
      this.logger = this.constructor.logger;
      this.utils = this.constructor.utils;

      this.cookies = this.constructor.cookies;
      this.random = seedrandom(this.farmer.account.id);

      /** Select User-Agent */
      this.userAgent =
        userAgents[Math.floor(this.random() * userAgents.length)];

      /** Cookie Jar */
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
            ["Origin"]: `https://${this.constructor.host}`,
            ["Referer"]: `https://${this.constructor.host}/`,
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
      this.retryApiRequests();

      /** Log API Response */
      if (process.env.NODE_ENV !== "production") {
        this.logApiRequests();
      }

      /** Register extra interceptors */
      if (this.configureApi) {
        this.configureApi();
      }
    }

    retryApiRequests() {
      this.api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          const isUnauthenticated = [401, 403, 418].includes(
            error?.response?.status
          );

          if (isUnauthenticated && !originalRequest._retry) {
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
            } catch (error) {
              this.logger.error("Failed to refresh auth:", error);
              return Promise.reject(error);
            } finally {
              this._fetchingAuth = false;
            }
          }

          return Promise.reject(error);
        }
      );
    }

    logApiRequests() {
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
          this.logger.output(
            `${this.logger.chalk.bold.blue(
              `${title}`
            )} ${this.logger.chalk.bold.cyan(
              `${method}`
            )} ${this.logger.chalk.bold.green(`${status} ${url}`)}`
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
          this.logger.log(
            `${this.logger.chalk.bold.blue(
              `${title}`
            )} ${this.logger.chalk.bold.cyan(
              `${method}`
            )} ${this.logger.chalk.bold.red(`${status} ${url}`)}`
          );
          return Promise.reject(error);
        }
      );
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

    /** Can Join Telegram Link */
    canJoinTelegramLink(link) {
      return Boolean(this.client);
    }

    /** Join Telegram Link */
    joinTelegramLink(link) {
      return this.client.joinTelegramLink(link);
    }

    async init() {
      /** Update WebAppData */
      if (this.farmer.account.session) {
        try {
          this.client = await GramClient.create(this.farmer.account.session);
          await this.client.connect();
          await this.updateWebAppData();
        } catch {
          this.logger.error("Failed to update WebAppData");
        }
      }

      /** Set Telegram Web App */
      this.setTelegramWebApp(this.farmer.telegramWebApp);

      /** Set Auth Headers */
      if (this.constructor.auth) {
        await this.setAuth();
      }

      /** Fetch Meta */
      await this.fetchMeta();

      /** Save Farmer */
      if (this.farmer.changed()) {
        await this.farmer.save();
      }

      return this;
    }

    async setAuth() {
      const auth = await this.fetchAuth();
      const headers = await this.getAuthHeaders(auth);
      this.farmer.setHeaders(headers);
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
        this.logger.error("Error:", error);
      }
    }

    static async execute(farmer, config) {
      const instance = new this(farmer, config);

      try {
        await instance.init();
        await instance.process();
      } catch (error) {
        await instance.disconnect();
        this.logger.error("Error:", farmer.accountId, error);
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
          this.logger.error("Failed to send farming notification:", error);
        }
      } catch (error) {
        this.logger.error("Error during run:", error);
      } finally {
        this.logger.success(`> ${this.title} Farmer Initiated`);
      }
    }
  };
}
