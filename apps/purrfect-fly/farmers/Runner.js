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

const AUTO_START_FARMER = env("AUTO_START_FARMER", false);
const HttpProxyAgentWithCookies = createCookieAgent(HttpProxyAgent);
const HttpsProxyAgentWithCookies = createCookieAgent(HttpsProxyAgent);

/**
 * @param {import("@purrfect/shared/lib/BaseFarmer").default} FarmerClass
 */
export default function createRunner(FarmerClass) {
  /** Environment Variables key */
  const envKey = "FARMER_" + FarmerClass.id.replace(/-/g, "_").toUpperCase();

  /** Is Farmer Enabled */
  const enabled = env(envKey + "_ENABLED", true);

  /** Telegram message thread */
  const threadId =
    env(envKey + "_THREAD_ID", "") || env("TELEGRAM_FARMING_THREAD_ID", "");

  /** Telegram bot link */
  const telegramLink = env(envKey + "_LINK", FarmerClass.telegramLink);

  return class Runner extends FarmerClass {
    static utils = utils;
    static enabled = enabled;
    static threadId = threadId;
    static telegramLink = telegramLink;
    static runners = new Map();
    static logger = new ConsoleLogger(process.env.NODE_ENV !== "production");

    constructor(account) {
      super();
      this.account = account;
      this.farmer = account.farmer;

      this.logger = this.constructor.logger; // Use static logger
      this.utils = this.constructor.utils; // Use static utils

      this.cookies = this.constructor.cookies; // Enable cookies if supported
      this.random = seedrandom(this.account.id); // Seeded RNG

      /** Select User-Agent */
      this.setUserAgent(
        userAgents[Math.floor(this.random() * userAgents.length)]
      );

      /** Cookie Jar */
      this.jar = this.cookies ? new CookieJar() : null;

      /** Proxy URL */
      this.proxy = this.account.proxy ? `http://${this.account.proxy}` : null;

      /** Agent */
      this.httpAgent = this.createAgent(this.proxy, false);
      this.httpsAgent = this.createAgent(this.proxy, true);

      /** Create API */
      this.api = this.createApi();

      /** Apply Delay */
      this.registerDelayInterceptor();

      /** Set Headers */
      this.registerHeadersInterceptor();

      /** Refetch Auth */
      this.retryApiRequests();

      /** Set XSRF */
      this.registerXSRFInterceptor();

      /** Log API Response */
      if (process.env.NODE_ENV !== "production") {
        this.logApiRequests();
      }

      /** Register extra interceptors */
      if (this.configureApi) {
        this.configureApi();
      }
    }

    createApi() {
      return axios.create({
        timeout: 60_000,
        httpAgent: this.httpAgent,
        httpsAgent: this.httpsAgent,
        headers: {
          common: {
            ["sec-ch-ua"]:
              '"Android WebView";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            ["sec-ch-ua-arch"]: '""',
            ["sec-ch-ua-arch-full-version"]: '""',
            ["sec-ch-ua-bitness"]: '""',
            ["sec-ch-ua-full-version-list"]: "",
            ["sec-ch-ua-mobile"]: "?0",
            ["sec-ch-ua-model"]: '""',
            ["sec-ch-ua-platform"]: '"Android"',
            ["sec-ch-ua-platform-version"]: '""',
            ["sec-fetch-dest"]: "empty",
            ["sec-fetch-mode"]: "cors",
            ["sec-fetch-site"]: "same-origin",
            ["x-requested-with"]: "org.telegram.messenger",
            ["User-Agent"]: this.userAgent,
            ["Origin"]: `https://${this.constructor.host}`,
            ["Referer"]: `https://${this.constructor.host}/`,
            ["Referrer-Policy"]: "strict-origin-when-cross-origin",
            ["Cache-Control"]: "no-cache",
          },
        },
      });
    }

    registerDelayInterceptor() {
      if (this.constructor.apiDelay) {
        this.api.interceptors.request.use(async (config) => {
          await this.utils.delay(this.constructor.apiDelay);
          return config;
        });
      }
    }

    registerHeadersInterceptor() {
      this.api.interceptors.request.use((config) => {
        /** Apply Headers */
        config.headers = {
          ...(!this.__isFetchingAuth ? this.farmer?.headers : {}),
          ...this.getExtraHeaders?.(),
          ...config.headers,
        };
        return config;
      });
    }

    registerXSRFInterceptor() {
      if (this.constructor.withXSRFToken) {
        this.api.interceptors.request.use(async (config) => {
          const xsrfToken = (
            await this.jar.getCookies(`https://${this.constructor.host}`)
          ).find((cookie) => cookie.key === "XSRF-TOKEN")?.value;

          if (xsrfToken) {
            config.headers["X-XSRF-TOKEN"] = xsrfToken;
          }
          return config;
        });
      }
    }

    retryApiRequests() {
      this.api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          const isUnauthenticatedError = [401, 403, 418].includes(
            error?.response?.status
          );

          if (
            isUnauthenticatedError &&
            !originalRequest.__retry &&
            !this.__isFetchingAuth
          ) {
            try {
              this.logger.warn("Refreshing auth...");

              /** Fetch new auth */
              await this.setAuth();
              await this.farmer.save();

              originalRequest.__retry = true;
              originalRequest.headers = {
                ...originalRequest.headers,
                ...this.farmer?.headers,
                ...this.getExtraHeaders?.(),
              };

              return this.api.request(originalRequest);
            } catch (error) {
              this.logger.error("Failed to refresh auth:", error);
              return Promise.reject(error);
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
          const title = this.utils.truncateAndPad(this.account.id, 10);
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
          const title = this.utils.truncateAndPad(this.account.id, 10);
          const status = this.utils.truncateAndPad(
            error.response?.status || "ERR",
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

    /** Create HTTP Agent */
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

    /** Prepare Instance */
    async prepare() {
      const needsAuth = !this.constructor.cacheAuth || !this.farmer;

      /** Create Farmer */
      if (!this.farmer) {
        this.farmer = await this.account.createFarmer({
          active: true,
          farmer: this.constructor.id,
          headers: {},
          initData: "",
        });
      }

      /** Update WebAppData */
      if (this.account.session) {
        try {
          this.client = await GramClient.create(this.account.session);
          await this.client.connect();
          await this.updateWebAppData();
        } catch (e) {
          this.logger.error("Failed to update WebAppData", e.message);
        }
      }

      /** Set Telegram Web App */
      this.setTelegramWebApp(this.farmer.telegramWebApp);

      /** Set Auth Headers */
      if (needsAuth) {
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
      try {
        this.__isFetchingAuth = true;
        const auth = await this.fetchAuth();
        const headers = await this.getAuthHeaders(auth);
        this.farmer.setHeaders(headers);
      } finally {
        this.__isFetchingAuth = false;
      }
    }

    /**
     * Get and update the initData using the telegram link for this farmer
     */
    async updateWebAppData() {
      const { url } = await this.client.getWebview(
        this.constructor.telegramLink
      );
      const { initData } = this.utils.extractTgWebAppData(url);

      this.farmer.initData = initData;
    }

    async disconnect() {
      try {
        if (!this.account.session) {
          if (this.farmer) {
            this.farmer.active = false;
            await this.farmer.save();
          }
        }
      } catch (error) {
        this.logger.error("Error disconnecting farmer:", error);
      }
    }

    static async execute(account) {
      const instance = new this(account);

      try {
        await instance.prepare();
        await instance.start();
      } catch (error) {
        await instance.disconnect();
        this.logger.error("Error:", account.id, error);
      }
    }

    static farm(account) {
      if (!this.runners.has(account.id)) {
        this.runners.set(account.id, Date.now());
        this.execute(account).finally(() => {
          this.runners.delete(account.id);
        });

        return {
          status: "started",
          startedAt: this.runners.get(account.id),
          elapsed: 0,
        };
      }

      return {
        status: "running",
        startedAt: this.runners.get(account.id),
        elapsed: Math.floor((Date.now() - this.runners.get(account.id)) / 1000),
      };
    }

    static async run({ user } = {}) {
      try {
        const farmerIsRequired = AUTO_START_FARMER === false;
        const additionalQueryOptions = user ? { where: { id: user } } : {};

        const accounts = await db.Account.findSubscribedWithFarmer(
          this.id,
          farmerIsRequired,
          additionalQueryOptions
        );

        /** Run all accounts */
        const results = accounts.map((account) => {
          /**
           * A farmer can be automatically created for an
           * account with an active telegram session if auto start is enabled
           */
          const shouldRunAccount = AUTO_START_FARMER
            ? account.farmer?.active || account.session
            : account.farmer?.active;

          return shouldRunAccount
            ? { account, result: this.farm(account) }
            : { account, result: { status: "skipped" } };
        });

        /** Send Farming Initiated Message */
        try {
          await bot?.sendFarmingInitiatedMessage({
            id: this.id,
            title: `${this.emoji} ${this.title}`,
            telegramLink: this.telegramLink,
            threadId: this.threadId,
            results,
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
