import { Cookie, CookieJar } from "tough-cookie";
import {
  HttpCookieAgent,
  HttpsCookieAgent,
  createCookieAgent,
} from "http-cookie-agent/http";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import userAgents, {
  regularMobileUserAgents,
} from "@purrfect/shared/resources/userAgents.js";

import ConsoleLogger from "@purrfect/shared/lib/ConsoleLogger.js";
import GramClient from "../lib/GramClient.js";
import axios from "axios";
import bot from "../lib/bot.js";
import captcha from "../lib/captcha.js";
import db from "../db/models/index.js";
import utils from "../lib/utils.js";

const AUTO_START_FARMER = env("AUTO_START_FARMER", false);
const HttpProxyAgentWithCookies = createCookieAgent(HttpProxyAgent);
const HttpsProxyAgentWithCookies = createCookieAgent(HttpsProxyAgent);

/**
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} FarmerClass
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
      this.debug = process.env.NODE_ENV !== "production";
      this.account = account;
      this.farmer = account.farmer;

      this.logger = this.constructor.logger; // Use static logger
      this.utils = this.constructor.utils; // Use static utils
      this.random = this.account.random(); // Seeded RNG

      /** Select User-Agent */
      this.setUserAgent(
        this.platform === "telegram"
          ? userAgents[Math.floor(this.random() * userAgents.length)]
          : regularMobileUserAgents[
              Math.floor(this.random() * regularMobileUserAgents.length)
            ],
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

      /** Set Captcha Solver */
      this.setCaptcha(captcha);
    }

    /** Create Axios Instance */
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

    /** Register Headers Interceptor */
    registerHeadersInterceptor() {
      this.api.interceptors.request.use((config) => {
        let extraHeaders = this.getExtraHeaders?.();
        let authHeaders = {};

        if (!this.isFetchingAuth) {
          authHeaders = this.farmer?.headers || {};
        }

        /** Apply Headers */
        config.headers = {
          ...authHeaders,
          ...extraHeaders,
          ...config.headers,
        };
        return config;
      });
    }

    /** Register XSRF Interceptor */
    registerXSRFInterceptor() {
      if (this.constructor.withXSRFToken) {
        this.api.interceptors.request.use(async (config) => {
          const xsrfToken = (
            await this.getCookies({ url: `https://${this.constructor.host}` })
          ).find((cookie) => cookie.name === "XSRF-TOKEN")?.value;

          if (xsrfToken) {
            config.headers["X-XSRF-TOKEN"] = xsrfToken;
          }
          return config;
        });
      }
    }

    /** Retry API Requests on Auth Failure */
    retryApiRequests() {
      this.api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          const isUnauthenticatedError = [401, 403, 418].includes(
            error?.response?.status,
          );

          if (
            isUnauthenticatedError &&
            !originalRequest.__retry &&
            !this.isFetchingAuth
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
        },
      );
    }

    /** Log API Requests */
    logApiRequests() {
      this.api.interceptors.response.use(
        (response) => {
          const url = response.config.url;
          const title = this.utils.truncateAndPad(this.account.id, 10);
          const status = this.utils.truncateAndPad(response.status, 3);
          const method = this.utils.truncateAndPad(
            response.config.method.toUpperCase(),
            4,
          );

          /** Log to Console */
          this.logger.output(
            `${this.logger.chalk.bold.blue(
              `${title}`,
            )} ${this.logger.chalk.bold.cyan(
              `${method}`,
            )} ${this.logger.chalk.bold.green(`${status} ${url}`)}`,
          );
          return response;
        },
        (error) => {
          const url = error.config.url;
          const title = this.utils.truncateAndPad(this.account.id, 10);
          const status = this.utils.truncateAndPad(
            error.response?.status || "ERR",
            3,
          );

          const method = this.utils.truncateAndPad(
            error.config.method.toUpperCase(),
            4,
          );

          /** Log to Console */
          this.logger.log(
            `${this.logger.chalk.bold.blue(
              `${title}`,
            )} ${this.logger.chalk.bold.cyan(
              `${method}`,
            )} ${this.logger.chalk.bold.red(`${status} ${url}`)}`,
          );
          return Promise.reject(error);
        },
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

    /** Join Telegram Link */
    async joinTelegramLink(link) {
      await this.utils.delayForSeconds(Math.floor(Math.random() * 300));
      return super.joinTelegramLink(link);
    }

    /** Get Cookies */
    async getCookies({ url }) {
      const cookies = await this.jar.getCookies(url);
      return cookies.map((cookie) => ({
        name: cookie.key,
        value: cookie.value,
      }));
    }

    /** Restore Cookies */
    async restoreCookies() {
      const list = this.farmer.cookies || [];

      for (const item of list) {
        for (const cookie of item.cookies) {
          await this.jar.setCookie(
            new Cookie({
              ...cookie,
              key: cookie.key || cookie.name,
              expiryTime: cookie.expiryTime || cookie.expirationDate,
            }),
            item.url,
          );
        }
      }
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
          cookies: [],
          initData: "",
        });
      }

      /** Update WebAppData */
      if (this.platform === "telegram" && this.account.session) {
        try {
          this.client = await GramClient.create(this.account.session);
          await this.client.connect();

          if (this.type === "webapp") {
            await this.updateWebAppData();
          }
        } catch (e) {
          this.logger.error("Failed to update WebAppData", e.message);
        }
      }

      /** Set Telegram Web App */
      if (this.platform === "telegram" && this.type === "webapp") {
        this.setTelegramWebApp(this.farmer.telegramWebApp);
      }

      /** Restore Cookies */
      if (this.cookies) {
        await this.restoreCookies();
      }

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

    getRunner() {
      return this.constructor.runners.get(this.account.id);
    }

    executeTask(task, callback, allowInQuickRun = true) {
      const runner = this.getRunner();
      runner.startedAt = new Date();
      runner.task = task;
      return super.executeTask(task, callback, allowInQuickRun);
    }

    /** Set Auth */
    async setAuth() {
      try {
        this.isFetchingAuth = true;
        const auth = await this.fetchAuth();
        const headers = await this.getAuthHeaders(auth);
        this.farmer.setHeaders(headers);
      } finally {
        this.isFetchingAuth = false;
      }
    }

    /**
     * Get and update the initData using the telegram link for this farmer
     */
    async updateWebAppData() {
      const { url } = await this.client.getWebview(
        this.constructor.telegramLink,
      );
      const { initData } = this.utils.extractTgWebAppData(url);

      this.farmer.initData = initData;
    }

    /** Disconnect Farmer */
    async disconnect() {
      try {
        if (this.platform !== "telegram" || !this.account.session) {
          if (this.farmer) {
            this.farmer.active = false;
            await this.farmer.save();
          }
        }
      } catch (error) {
        this.logger.error("Error disconnecting farmer:", error);
      }
    }

    /** Execute farming for account */
    static async execute(account) {
      const instance = new this(account);

      try {
        if (process.env.NODE_ENV === "production") {
          /**
           * Random startup delay to avoid all accounts starting at the same time
           */
          const startupDelay = Math.floor(
            instance.random() * this.startupDelay,
          );
          if (startupDelay) {
            instance.logger.info(
              `[${account.id}] Delaying startup by ${startupDelay} seconds...`,
            );
            await instance.utils.delayForSeconds(startupDelay);
          }
        }
        await instance.prepare();
        await instance.start();
      } catch (error) {
        await instance.disconnect();
        this.logger.error("Error farming account:", account.id, error);
      }
    }

    /** Farm an account */
    static farm(account) {
      if (!this.runners.has(account.id)) {
        this.runners.set(account.id, {
          startedAt: new Date(),
          task: null,
        });
        this.execute(account).finally(() => {
          this.runners.delete(account.id);
        });
      }

      const runner = this.runners.get(account.id);
      const elapsed = this.utils.dateFns.formatDistanceStrict(
        new Date(),
        runner.startedAt,
      );

      return {
        status: runner.task ? "running" : "started",
        startedAt: runner.startedAt,
        task: runner.task,
        elapsed,
      };
    }

    /** Run the farmer for all subscribed accounts */
    static async run({ user } = {}) {
      try {
        /** Determine if farmer is required */
        const farmerIsRequired =
          this.platform !== "telegram" || !AUTO_START_FARMER;
        const additionalQueryOptions = user ? { where: { id: user } } : {};

        /** Fetch Subscribed Accounts */
        const accounts = await db.Account.findSubscribedWithFarmer(
          this.id,
          farmerIsRequired,
          additionalQueryOptions,
        );

        /** Run all accounts */
        const results = accounts.map((account) => {
          /**
           * A farmer can be automatically created for an
           * account with an active telegram session if auto start is enabled
           */
          const shouldRunAccount =
            this.platform === "telegram" && AUTO_START_FARMER
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
            link: this.link,
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
