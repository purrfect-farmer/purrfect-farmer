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
import logger from "../lib/logger.js";
import utils from "../lib/utils.js";

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

  /** Default primary account ID */
  const defaultPrimaryAccountId = env("PRIMARY_ACCOUNT_ID");

  /** Farmer primary account ID */
  const farmerPrimaryAccountId = env(
    envKey + "_PRIMARY_ACCOUNT_ID",
    defaultPrimaryAccountId,
  );

  /** Primary account ID */
  const primaryAccountId = Number(farmerPrimaryAccountId) || 0;

  /** Log */
  logger.success(`${FarmerClass.title} Farmer`);
  logger.keyValue("Enabled", enabled);
  logger.keyValue("Primary account ID", primaryAccountId, {
    format: false,
  });
  logger.newline();

  return class Runner extends FarmerClass {
    static utils = utils;
    static enabled = enabled;
    static threadId = threadId;
    static telegramLink = telegramLink;
    static primaryAccountId = primaryAccountId;
    static primaryFarmerLink = null;
    static runners = new Map();
    static logger = new ConsoleLogger(process.env.NODE_ENV !== "production");
    static queue = [];
    static isProcessingQueue = false;

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
        this.constructor.platform === "telegram"
          ? userAgents[Math.floor(this.random() * userAgents.length)]
          : regularMobileUserAgents[
              Math.floor(this.random() * regularMobileUserAgents.length)
            ],
      );

      /** Cookie Jar */
      this.jar = this.constructor.cookies ? new CookieJar() : null;

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

      /** Configure Telegram Web app */
      this.configureTelegramWebApp();
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
        return this.constructor.cookies
          ? new cookieAgentType({ proxy, cookies: { jar: this.jar } })
          : new proxyAgentType({ proxy });
      } else {
        return this.constructor.cookies
          ? new defaultAgentType({ cookies: { jar: this.jar } })
          : null;
      }
    }

    /** Join Telegram Link */
    async joinTelegramLink(link) {
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
      if (this.constructor.platform === "telegram" && this.account.session) {
        try {
          this.client = await GramClient.create(this.account.session);
          await this.client.connect();

          if (this.constructor.type === "webapp") {
            await this.updateWebAppData();
          }
        } catch (e) {
          this.logger.error("Failed to update WebAppData", e.message);
        }
      }

      /** Set Telegram Web App */
      this.configureTelegramWebApp();

      /** Restore Cookies */
      if (this.constructor.cookies) {
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

    /** Configure Telegram Web App */
    configureTelegramWebApp() {
      /** Set Telegram Web App */
      if (
        this.constructor.platform === "telegram" &&
        this.constructor.type === "webapp" &&
        this.farmer
      ) {
        this.setTelegramWebApp(this.farmer.telegramWebApp);
      }
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
        if (this.farmer) {
          /** Set as inactive */
          this.farmer.active = false;

          /** Increase error count */
          this.farmer.errorCount += 1;

          /** Ban the farmer */
          if (this.farmer.errorCount >= 3) {
            this.farmer.isBanned = true;
          }

          /** Save */
          await this.farmer.save();
        }
      } catch (error) {
        this.logger.error("Error disconnecting farmer:", error);
      }
    }

    /** Execute farming for an instance
     * @param {Runner} instance
     */
    static async execute(instance) {
      try {
        if (process.env.NODE_ENV === "production") {
          /* Random wait seconds */
          const waitSeconds =
            30 + Math.floor(Math.random() * this.startupDelay);

          if (waitSeconds) {
            this.logger.info(
              `[${instance.account.id}] Delaying startup by ${waitSeconds} seconds...`,
            );
            await this.utils.delayForSeconds(waitSeconds);
          }
        }

        /** Prepare instance */
        await instance.prepare();

        /** Update the primary farmer link */
        await this.updatePrimaryFarmerLink(instance);

        /** Start instance */
        await instance.start();
      } catch (error) {
        if (this.deactivateOnError) {
          await instance.disconnect();
        }
        this.logger.error("Error farming account:", instance.account.id, error);
      }
    }

    /** Update the primary farmer link
     * @param {Runner} instance
     */
    static async updatePrimaryFarmerLink(instance) {
      if (
        this.primaryFarmerLink ||
        instance.account.id !== this.primaryAccountId
      ) {
        return;
      }
      try {
        /** Update the primary farmer link */
        this.primaryFarmerLink = await instance.getReferralLink();

        /** Configure the primary farmer link */
        this.configurePrimaryLink(this.primaryFarmerLink);

        /** Log */
        this.logger.force(() =>
          this.logger.success(
            `${this.title} Farmer - updated primary farmer link:`,
            this.primaryFarmerLink,
          ),
        );
      } catch (e) {
        /** Log */
        this.logger.force(() => {
          /** Log error */
          this.logger.error(
            `${this.title} Farmer - failed to update primary farmer link:`,
            e,
          );
        });

        /** Reset the primary farmer link */
        this.resetPrimaryFarmerLink();
      }
    }

    /** Process queue */
    static async processQueue() {
      if (this.isProcessingQueue) return;
      this.isProcessingQueue = true;

      try {
        while (this.queue.length > 0) {
          let instance;

          const primaryIndex = !this.primaryFarmerLink
            ? this.queue.findIndex(
                (item) => item.account.id === this.primaryAccountId,
              )
            : -1;

          const newAccountIndex =
            primaryIndex === -1
              ? this.queue.findIndex((item) => !item.account.farmer)
              : -1;

          if (primaryIndex !== -1) {
            instance = this.queue.splice(primaryIndex, 1)[0];

            /** Log */
            this.logger.info(
              "Prioritizing primary account:",
              this.primaryAccountId,
            );
          } else if (newAccountIndex !== -1) {
            instance = this.queue.splice(newAccountIndex, 1)[0];

            /** Log */
            this.logger.info("Prioritizing new account:", instance.account.id);
          } else {
            instance = this.queue.shift();
          }

          try {
            await this.execute(instance);
          } catch (err) {
            /** Log error */
            this.logger.error("Queue processing error:", err);

            /** Unblock queue */
            if (instance.account.id === this.primaryAccountId) {
              this.resetPrimaryFarmerLink();
            }
          } finally {
            this.runners.delete(instance.account.id);
          }
        }
      } finally {
        this.isProcessingQueue = false;
      }
    }

    /** Reset primary farmer link */
    static resetPrimaryFarmerLink() {
      if (this.primaryFarmerLink) return;

      /** Update link */
      this.primaryFarmerLink =
        this.platform === "telegram" ? this.telegramLink : this.link;

      /** Log */
      this.logger.force(() =>
        this.logger.warn(
          `${this.title} Farmer - configuring default farmer link:`,
          this.primaryFarmerLink,
        ),
      );
    }

    /** Prepare an account */
    static prepare(account) {
      if (!this.runners.has(account.id)) {
        const instance = new this(account);
        this.runners.set(account.id, instance);
        this.queue.push(instance);
      }
    }

    /** Get Result */
    static getResult(account) {
      const instance = this.runners.get(account.id);
      if (!instance) {
        return { status: "skipped" };
      }

      return {
        status: instance.currentTask ? "running" : "started",
        startedAt: instance.startedAt,
        currentTaskStartedAt: instance.currentTaskStartedAt,
        currentTask: instance.currentTask,
        elapsed: instance.getElapsedTime(),
      };
    }

    /** Run the farmer for all subscribed accounts */
    static async run({ user } = {}) {
      try {
        /** Determine if farmer is required */
        const farmerIsRequired = this.platform !== "telegram";
        const additionalQueryOptions = user ? { where: { id: user } } : {};

        /** Fetch Subscribed Accounts */
        const subscribedList = await db.Account.findSubscribedWithFarmer(
          this.id,
          farmerIsRequired,
          additionalQueryOptions,
        );

        /** Filter unbanned accounts */
        const accounts = subscribedList.filter((item) => {
          return !item.farmer?.isBanned;
        });

        /** Primary account */
        const primaryAccount = accounts.find(
          (acc) => acc.id === this.primaryAccountId,
        );

        /** Can launch primary account */
        const canLaunchPrimaryAccount =
          primaryAccount?.farmer?.active || primaryAccount?.session;

        /** Get accounts to be executed  */
        const list = accounts.map((account) => {
          /**
           * A farmer can be automatically created for an
           * account with an active telegram session if auto start is enabled
           */
          const canAutoStart =
            this.platform === "telegram" && canLaunchPrimaryAccount;
          const execute = canAutoStart
            ? account.farmer?.active || account.session
            : account.farmer?.active;

          return { account, execute };
        });

        /** Prepare accounts to be executed */
        this.utils
          .shuffle(list.filter((item) => item.execute))
          .forEach((item) => this.prepare(item.account));

        /** Process queue */
        this.processQueue();

        /** Get results */
        const results = list.map((item) => {
          const { account } = item;
          return { account, result: this.getResult(account) };
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
