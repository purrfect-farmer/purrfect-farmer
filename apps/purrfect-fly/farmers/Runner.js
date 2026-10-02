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
import { getFarmerEnvPrefix } from "../config/env-schema.js";
import GramClient from "../lib/GramClient.js";
import axios from "axios";
import bot from "../lib/bot.js";
import captcha from "../lib/captcha.js";
import db from "../db/models/index.js";
import logger from "../lib/logger.js";
import utils from "../lib/utils.js";

/** Ban trigger count */
const BAN_TRIGGER_COUNT = env("BAN_TRIGGER_COUNT", 10);

/** Concurrent accounts */
const MAX_CONCURRENT_ACCOUNTS = env("MAX_CONCURRENT_ACCOUNTS", 20);

/** Max retries for rate-limited (429) requests */
const API_MAX_RETRY_COUNT = env("API_MAX_RETRY_COUNT", 10);

/** Base delay (ms) for retry backoff */
const API_RETRY_BASE_DELAY = env("API_RETRY_BASE_DELAY", 1000);

const HttpProxyAgentWithCookies = createCookieAgent(HttpProxyAgent);
const HttpsProxyAgentWithCookies = createCookieAgent(HttpsProxyAgent);

/**
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} FarmerClass
 */
export default function createRunner(FarmerClass) {
  /** Environment Variables key */
  const FARMER_ENV_BASE_KEY = getFarmerEnvPrefix(FarmerClass.id);

  /** Get Environment Variable */
  const getFarmerEnv = (key, defaultValue) => {
    return env(FARMER_ENV_BASE_KEY + "_" + key, defaultValue);
  };

  /** Is Farmer Enabled */
  const enabled = getFarmerEnv("ENABLED", FarmerClass.enabled);

  /** Is Farmer Auto-Started */
  const autoStart = getFarmerEnv("AUTO_START", FarmerClass.autoStart);

  /** Skip execution of new accounts */
  const skipExecutionOfNewAccount = getFarmerEnv(
    "SKIP_EXECUTION_OF_NEW_ACCOUNT",
    FarmerClass.skipExecutionOfNewAccount,
  );

  /** Interval */
  const interval = getFarmerEnv("INTERVAL", FarmerClass.interval);

  /** Telegram message thread */
  const threadId =
    getFarmerEnv("THREAD_ID", "") || env("TELEGRAM_FARMING_THREAD_ID", "");

  /** Telegram bot link */
  const telegramLink = getFarmerEnv("LINK", FarmerClass.telegramLink);

  const defaultReferrerMode = env("DEFAULT_REFERRER_MODE", "single");
  const farmerReferrerMode = getFarmerEnv("REFERRER_MODE", defaultReferrerMode);

  /** Referrer mode */
  const referrerMode = farmerReferrerMode || FarmerClass.referrerMode;

  /** Default primary account ID */
  const defaultPrimaryAccountId = env("PRIMARY_ACCOUNT_ID");

  /** Farmer primary account ID */
  const farmerPrimaryAccountId = getFarmerEnv(
    "PRIMARY_ACCOUNT_ID",
    defaultPrimaryAccountId,
  );

  /** Primary account ID */
  const primaryAccountId = Number(farmerPrimaryAccountId) || 0;

  /** Log */
  logger.success(`${FarmerClass.title} Farmer`);
  logger.keyValue("Enabled", enabled);
  logger.keyValue("Auto-Start", autoStart);
  logger.keyValue("Telegram link", telegramLink);
  logger.keyValue("Thread ID", threadId);
  logger.keyValue("Referrer mode", referrerMode);
  logger.keyValue("Interval", interval);
  logger.keyValue("Skip execution of new accounts", skipExecutionOfNewAccount);
  logger.keyValue("Primary account ID", primaryAccountId, {
    format: false,
  });

  /** Primary account is required */
  if (!primaryAccountId) {
    logger.warn("Primary account ID is not configured!");
  }

  logger.newline();

  return class Runner extends FarmerClass {
    static utils = utils;
    static enabled = enabled;
    static autoStart = autoStart;
    static threadId = threadId;
    static skipExecutionOfNewAccount = skipExecutionOfNewAccount;
    static telegramLink = telegramLink;
    static referrerMode = referrerMode;
    static primaryAccountId = primaryAccountId;
    static interval = interval;
    static primaryFarmerLink = null;
    static primaryLinkResolved = false;
    static primaryAccountWarning = null;
    static runners = new Map();
    static terminated = new Set();
    static referralLinks = new Map();
    static logger = new ConsoleLogger(process.env.NODE_ENV !== "production");
    static queue = [];
    static isProcessingQueue = false;

    constructor({ account, referralLink = null, scheduled = false } = {}) {
      super({ referralLink });
      this.debug = process.env.NODE_ENV !== "production";
      this.account = account;
      this.farmer = account.farmer;
      this.scheduled = scheduled;

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

      /** Register Signal Interceptor */
      this.registerSignalInterceptor();

      /** Apply Delay */
      this.registerDelayInterceptor();

      /** Set XSRF */
      this.registerXSRFInterceptor();

      /** Retry rate-limited requests */
      this.registerRetryInterceptor();

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

      /** Setup storage */
      this.setupStorage();
    }

    /** Setup storage */
    setupStorage() {
      this.storage = {
        get: async (key) => {
          return this.farmer?.storage?.[key];
        },
        set: async (key, value) => {
          if (this.farmer) {
            this.farmer.storage = {
              ...this.farmer.storage,
              [key]: value,
            };

            await this.farmer.save();
          }
        },
      };
    }

    /** Notify the server admin via the bot */
    async notifyAdmin(messages) {
      return bot?.sendAdminMessage(messages);
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

    /** Register Signal Interceptor */
    registerSignalInterceptor() {
      this.api.interceptors.request.use(async (config) => {
        if (!config.signal && this.signal) {
          config.signal = this.signal;
        }
        return config;
      });
    }

    /** Register Retry Interceptor */
    registerRetryInterceptor() {
      this.api.interceptors.response.use(null, async (error) => {
        const config = error.config;

        /** If no config or response, reject the error */
        if (!config || !error.response) {
          return Promise.reject(error);
        }

        /** Only retry rate-limited (429) responses */
        if (error.response?.status !== 429) {
          /** Determine if the request should be explicitly retried */
          const shouldRetry =
            typeof this.shouldRetryRequest === "function"
              ? this.shouldRetryRequest(error)
              : true;

          /** If not explicitly retried, reject the error */
          if (!shouldRetry) {
            return Promise.reject(error);
          }
        }

        /** Track retry count on the request config */
        config.__retryCount = config.__retryCount || 0;

        if (config.__retryCount >= API_MAX_RETRY_COUNT) {
          return Promise.reject(error);
        }

        /** Increment retry count */
        config.__retryCount += 1;

        /** Respect Retry-After header, else exponential backoff */
        const retryAfter = this.parseRetryAfter(
          error.response.headers?.["retry-after"],
        );
        const backoff = API_RETRY_BASE_DELAY * 2 ** (config.__retryCount - 1);
        const delay = retryAfter ?? backoff;

        this.logger.warn(
          `[${this.account.id}] Rate limited (429) on ${config.url}. Retrying in ${delay}ms (attempt ${config.__retryCount}/${API_MAX_RETRY_COUNT})`,
        );

        /** Wait before retrying (aborts cleanly on termination) */
        await this.utils.delay(delay, { signal: this.signal });

        /** Replay the original request */
        return this.api(config);
      });
    }

    /** Parse a Retry-After header value into milliseconds */
    parseRetryAfter(value) {
      if (!value) return null;

      /** Numeric value is in seconds */
      const seconds = Number(value);
      if (!Number.isNaN(seconds)) {
        return Math.max(0, seconds * 1000);
      }

      /** Otherwise it may be an HTTP date */
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return Math.max(0, date.getTime() - Date.now());
      }

      return null;
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
      const ProxyAgentType = isHttps ? HttpsProxyAgent : HttpProxyAgent;
      const ProxyAgentWithCookiesType = isHttps
        ? HttpsProxyAgentWithCookies
        : HttpProxyAgentWithCookies;
      const CookiesAgentType = isHttps ? HttpsCookieAgent : HttpCookieAgent;

      if (proxy) {
        return this.cookies
          ? new ProxyAgentWithCookiesType({
              timeout: 30_000,
              cookies: { jar: this.jar },
              proxy,
            })
          : new ProxyAgentType({ proxy, timeout: 30_000 });
      } else {
        return this.cookies
          ? new CookiesAgentType({ cookies: { jar: this.jar } })
          : null;
      }
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

    /** Get Referral Link */
    async getReferralLink() {
      if (this.farmer && this.farmer.referralLink) {
        return this.farmer.referralLink;
      } else {
        const link = await super.getReferralLink();
        if (this.farmer) {
          this.farmer.referralLink = link;
          await this.farmer.save();
        }
        return link;
      }
    }

    /** Create Farmer */
    async createFarmer() {
      return this.account.createFarmer({
        farmer: this.constructor.id,
        status: "active",
        errorCount: 0,
        initData: "",
        headers: {},
        cookies: [],
        storage: {},
        options: {},
      });
    }

    /** Refresh Account */
    async refreshFarmerAccount() {
      const account = await this.account.reload({
        include: [
          {
            required: false,
            association: "farmers",
            where: {
              farmer: this.constructor.id,
            },
          },
        ],
      });
      this.account = account;
      this.farmer = account.farmer;
    }

    /** Prepare Instance */
    async prepare() {
      /** Refresh Account */
      await this.refreshFarmerAccount();

      const needsAuth = !this.cacheAuth || !this.farmer;

      /** Create Farmer */
      if (!this.farmer) {
        this.farmer = await this.createFarmer();
      }

      /** Update WebAppData */
      if (this.platform === "telegram" && this.account.session) {
        try {
          /** Create Telegram Client */
          this.client = await GramClient.create(this.account.session);

          /** Connect */
          await this.client.connect();

          /** Update the web app data */
          if (this.type === "webapp") {
            await this.updateWebAppData();
          }
        } catch (e) {
          this.logger.error("Failed to update WebAppData", e.message);
        }
      }

      /** Set Telegram Web App */
      this.configureTelegramWebApp();

      /** Restore Cookies */
      if (this.cookies) {
        await this.restoreCookies();
      }

      /** Prepare Auth Headers */
      if (needsAuth) {
        await this.prepareAuth();
      } else if (this.cacheAuth) {
        const data = await this.storage.get("runner:auth");
        if (data) {
          this.restoreCachedAuthData(data);
        }
      }

      /** Set Auth Headers */
      if (this.farmer.headers) {
        this.setAuthHeaders(this.farmer.headers);
      }

      /** Fetch Meta */
      await this.fetchMeta();

      /** Save Farmer */
      if (this.farmer.changed()) {
        await this.farmer.save();
      }

      /** Update the primary farmer link */
      await this.constructor.updatePrimaryFarmerLink(this);

      return this;
    }

    /** Configure Telegram Web App */
    configureTelegramWebApp() {
      /** Set Telegram Web App */
      if (
        this.platform === "telegram" &&
        this.type === "webapp" &&
        this.farmer
      ) {
        this.setTelegramWebApp(this.farmer.telegramWebApp);
      }
    }

    /** Prepare Auth */
    async prepareAuth() {
      const auth = await this.fetchAuth();
      const headers = await this.getAuthHeaders(auth);
      this.farmer.setHeaders(headers);

      if (this.cacheAuth) {
        await this.storage.set("runner:auth", auth);
      }
    }

    /**
     * Get and update the initData using the telegram link for this farmer
     */
    async updateWebAppData() {
      /** Log link for init data */
      this.logger.info(
        `[${this.account.id}] Updating init data:`,
        this.telegramLink,
      );

      const { url } = await this.client.getWebview(this.telegramLink);
      const { initData } = this.utils.extractTgWebAppData(url);

      this.farmer.initData = initData;

      this.logger.success("Successfully updated init data!");
    }

    /** Disconnect Farmer */
    async disconnect() {
      try {
        if (this.farmer) {
          /** Set as inactive */
          this.farmer.status = "inactive";

          /** Increase error count */
          this.farmer.errorCount += 1;

          /** Ban the farmer */
          if (this.farmer.errorCount >= BAN_TRIGGER_COUNT) {
            this.farmer.status = "banned";
          }

          /** Save */
          await this.farmer.save();
        }
      } catch (error) {
        this.logger.error("Error disconnecting farmer:", error);
      }
    }

    /**
     * Determine whether an error is transient (proxy timeout, aborted, or
     * 5xx server error) and therefore should NOT count toward deactivating
     * or banning the account.
     */
    static isTransientError(error) {
      if (!error) return false;

      /** Server-side errors (500+) are not the account's fault */
      if (error.response?.status >= 500) {
        return true;
      }

      /** Timeout or aborted requests */
      const message = String(error.message || "").toLowerCase();
      return message.includes("timeout") || message.includes("aborted");
    }

    /** Reset error count */
    async resetErrorCount() {
      try {
        if (this.farmer && this.farmer.errorCount > 0) {
          /** Set as active */
          this.farmer.status = "active";

          /** Reset error count */
          this.farmer.errorCount = 0;

          /** Save */
          await this.farmer.save();
        }
      } catch (error) {
        this.logger.error("Error resetting error count:", error);
      }
    }

    /** Terminate instance
     *
     * Aborts any running instance and excludes the account from future
     * batches until `resume` is called.
     */
    static terminate(id) {
      /** Exclude account from future batches */
      this.terminated.add(id);

      const instance = this.runners.get(id);
      if (instance) {
        instance.controller.abort();
      }
    }

    /** Resume instance
     *
     * Allows a previously terminated account to be included in batches again.
     */
    static resume(id) {
      this.terminated.delete(id);
    }

    /** Abort a running instance without excluding the account from future batches
     */
    static abort(id) {
      this.runners.get(id)?.controller.abort();
    }

    /** Execute farming for an instance
     * @param {Runner} instance
     */
    static async execute(instance, skipExecution = false) {
      try {
        /** Configure the startup link for the instance */
        instance.configureStartupLink(this.getInstanceReferralLink());

        /** Prepare instance */
        await instance.prepare();

        /** Start instance */
        if (!skipExecution) {
          await instance.start();
        }

        /** Reset error count */
        await instance.resetErrorCount();
      } catch (error) {
        /**
         * A terminated instance was aborted deliberately so it is not a farming failure to report.
         */
        if (instance.signal.aborted) {
          this.logger.info("Aborted farming account:", instance.account.id);
          return;
        }

        /**
         * Transient errors (proxy/connection timeouts, aborted requests,
         * 5xx server errors) are not the account's fault, so they must not
         * count toward deactivating or banning it.
         */
        if (this.deactivateOnError && !this.isTransientError(error)) {
          await instance.disconnect();
        }

        /** Log error */
        this.logger.error("Error farming account:", instance.account.id, error);

        /** Send error message */
        await bot?.sendFarmerErrorMessage(
          this.id,
          this.title,
          instance.account.id,
          instance.currentTask,
          error.message || "Unknown error!",
        );
      }
    }

    /** Update the primary farmer link
     * @param {Runner} instance
     */
    static async updatePrimaryFarmerLink(instance) {
      try {
        let referralLink = this.referralLinks.get(instance.account.id);

        if (!referralLink) {
          referralLink = await instance.getReferralLink();
          this.referralLinks.set(instance.account.id, referralLink);
        }

        /** A real link may replace the default fallback */
        if (
          this.primaryLinkResolved ||
          instance.account.id !== this.primaryAccountId
        ) {
          return;
        }

        /** Update the primary farmer link */
        this.primaryFarmerLink = referralLink;
        this.primaryLinkResolved = true;

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
        this.resetPrimaryFarmerLink(instance);
      }
    }

    /** Process queue, refilling each freed slot up to MAX_CONCURRENT_ACCOUNTS */
    static async processQueue() {
      if (this.isProcessingQueue) return;
      this.isProcessingQueue = true;

      /** In-flight items, keyed by their promise */
      const active = new Map();

      /** Launches so far, used for the initial ramp-up */
      let launched = 0;

      try {
        while (this.queue.length > 0 || active.size > 0) {
          /** Fill every free slot */
          while (active.size < MAX_CONCURRENT_ACCOUNTS) {
            const item = this.dequeueQueueItem(active);

            /** Nothing runnable right now */
            if (!item) break;

            /** Stagger only the initial ramp-up, then refill instantly */
            const staggerSeconds =
              item.exclusive || launched >= MAX_CONCURRENT_ACCOUNTS
                ? 0
                : launched * (item.instance.account.farmer ? 20 : 60);

            /** Launch and free the slot once it settles */
            const promise = this.processQueueItem(item, staggerSeconds)
              .catch(() => {})
              .finally(() => active.delete(promise));

            active.set(promise, item);

            /** The exclusive primary launch does not consume the ramp-up */
            if (!item.exclusive) {
              launched += 1;
            }
          }

          /** Guard against a stalled queue */
          if (active.size === 0) break;

          /** One completion frees one slot */
          await Promise.race(active.keys());
        }
      } finally {
        this.isProcessingQueue = false;
      }
    }

    /** Pick the next runnable item, or null when nothing may start yet
     * @param {Map} active
     */
    static dequeueQueueItem(active) {
      if (this.queue.length === 0) return null;

      /** Prioritize primary account if the primary link is not set */
      if (!this.primaryFarmerLink) {
        /** Hold everything back while the primary account runs */
        if (Array.from(active.values()).some((item) => item.exclusive)) {
          return null;
        }

        const primary = this.queue.find(
          (item) => item.account.id === this.primaryAccountId,
        );

        if (primary) {
          /** The primary account runs alone until the link resolves */
          if (active.size > 0) return null;

          /** Log */
          this.logger.info(
            "Prioritizing primary account:",
            this.primaryAccountId,
          );

          return this.takeQueueItem(primary, true);
        }
      }

      /** Process one new account at a time */
      const hasNewAccount = Array.from(active.values()).some(
        (item) => !item.instance.account.farmer,
      );

      const instance = hasNewAccount
        ? this.queue.find((item) => item.account.farmer)
        : this.queue.find((item) => !item.account.farmer) ||
          this.queue.find((item) => item.account.farmer);

      return instance ? this.takeQueueItem(instance) : null;
    }

    /** Remove an instance from the queue and wrap it as a queue item */
    static takeQueueItem(instance, exclusive = false) {
      this.queue.splice(this.queue.indexOf(instance), 1);

      return {
        instance,
        exclusive,
        skipExecution:
          !instance.account.farmer && this.skipExecutionOfNewAccount,
      };
    }

    /** Process queue item */
    static async processQueueItem(
      { instance, skipExecution = false },
      staggerSeconds = 0,
    ) {
      try {
        /** Stagger the launch: an account terminated while waiting skips its turn */
        if (staggerSeconds > 0) {
          await this.utils.delayForSeconds(staggerSeconds, {
            signal: instance.signal,
          });
        }

        await this.execute(instance, skipExecution);
      } catch (err) {
        if (instance.signal.aborted) {
          /** Terminated before its turn came up */
          this.logger.info("Skipped terminated account:", instance.account.id);
        } else {
          /** Log error */
          this.logger.error("Queue processing error:", err);

          /** Unblock queue */
          if (instance.account.id === this.primaryAccountId) {
            this.resetPrimaryFarmerLink(instance);
          }
        }
      } finally {
        /** Delete instance */
        this.runners.delete(instance.account.id);
      }
    }

    /** Reset primary farmer link */
    static resetPrimaryFarmerLink(instance) {
      if (
        this.primaryLinkResolved ||
        instance.account.id !== this.primaryAccountId
      )
        return;

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

    /** Get primary farmer link */
    static getPrimaryFarmerLink() {
      if (this.primaryFarmerLink) return this.primaryFarmerLink;
      else if (this.platform === "telegram") return this.telegramLink;
      else return this.link;
    }

    /** Get instance referral link */
    static getInstanceReferralLink() {
      if (this.referrerMode === "single") {
        return this.getPrimaryFarmerLink();
      } else {
        const links = Array.from(this.referralLinks.values());
        const random = this.utils.randomItem(links);

        return random || this.getPrimaryFarmerLink();
      }
    }

    /** Prepare an account */
    static prepare(account, scheduled = false) {
      if (!this.runners.has(account.id)) {
        const instance = new this({
          account,
          scheduled,
          referralLink: this.getInstanceReferralLink(),
        });
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

    /** Explain why the primary account was left out of the run
     * @param {Array} accountsWithFarmer
     */
    static getPrimaryAccountMissingReason(accountsWithFarmer) {
      if (!this.primaryAccountId) return "not-configured";

      const account = accountsWithFarmer.find(
        (acc) => acc.id === this.primaryAccountId,
      );

      if (!account) return "not-found";
      if (this.platform !== "telegram" && !account.farmer) return "no-farmer";
      if (["frozen", "banned"].includes(account.farmer?.status)) {
        return account.farmer.status;
      }
      if (this.terminated.has(account.id)) return "terminated";
      if (!account.farmingEnabled) return "farming-disabled";

      return "not-found";
    }

    /** Notify that the primary account is not configured or not runnable */
    static async notifyPrimaryAccountMissing(reason) {
      const account = `primary account (<code>${this.primaryAccountId}</code>)`;
      const details = {
        "not-configured": "primary account is not configured",
        "not-found": `${account} not found or has no active subscription`,
        "no-farmer": `${account} has no farmer`,
        frozen: `${account} farmer is frozen`,
        banned: `${account} farmer is banned`,
        terminated: `${account} is terminated`,
        "farming-disabled": `${account} has farming disabled`,
      };

      const messages = [
        `⚠️ <b>${this.title} Farmer</b>: ${details[reason]}`,
        `<i>New accounts will not auto-start.</i>`,
      ];

      try {
        /** Group message replaces the previous one */
        await bot?.sendPrimaryAccountMissingMessage(this.id, messages);

        /** Admin is only messaged when the reason changes */
        if (this.primaryAccountWarning !== reason) {
          this.primaryAccountWarning = reason;
          await bot?.sendAdminMessage(messages);
        }
      } catch (error) {
        this.logger.error("Failed to send primary account notification:", error);
      }
    }

    /** Run the farmer for all subscribed accounts */
    static async run({ user } = {}) {
      try {
        /** Determine if farmer is required based on platform */
        const farmerIsRequired = this.platform !== "telegram";

        /** Fetch accounts with farmer and active subscription */
        const accountsWithFarmer = await db.Account.findSubscribedWithFarmer(
          this.id,
        );

        /** Fetch Subscribed Accounts */
        let subscribedList = accountsWithFarmer;

        if (farmerIsRequired) {
          /** Filter accounts with farmer */
          subscribedList = subscribedList.filter((item) => item.farmer);
        }

        /** Filter by user if specified */
        if (user) {
          subscribedList = subscribedList.filter(
            (item) => Number(item.id) === Number(user),
          );
        }

        /** Filter out frozen, banned, terminated and non-farming accounts */
        const accounts = subscribedList.filter((item) => {
          return (
            !["frozen", "banned"].includes(item.farmer?.status) &&
            !this.terminated.has(item.id) &&
            item.farmingEnabled
          );
        });

        /** Primary account */
        const primaryAccount = this.primaryAccountId
          ? accounts.find((acc) => acc.id === this.primaryAccountId)
          : null;

        /** Notify when the primary account is missing (a single-user run never includes it) */
        if (!user) {
          if (primaryAccount) {
            this.primaryAccountWarning = null;
          } else {
            await this.notifyPrimaryAccountMissing(
              this.getPrimaryAccountMissingReason(accountsWithFarmer),
            );
          }
        }

        /** Can launch primary account */
        const canLaunchPrimaryAccount =
          primaryAccount?.farmer?.status === "active" ||
          Boolean(primaryAccount?.session);

        /** Accounts without farmer may be auto-started */
        const autoStartEnabled = this.autoStart && this.platform === "telegram";

        /** Single referrer mode waits for the primary link */
        const canAutoStart =
          autoStartEnabled &&
          canLaunchPrimaryAccount &&
          (this.referrerMode !== "single" || this.primaryLinkResolved);

        /** Get accounts to be executed  */
        const executableList = accounts.filter((account) => {
          const accountIsActive = account.farmer?.status === "active";

          /** The primary account may always auto-start to resolve its link */
          const isPrimary =
            autoStartEnabled && account.id === this.primaryAccountId;

          /**
           * A farmer can be automatically created for an
           * account with an active telegram session
           */
          return (
            accountIsActive ||
            Boolean(account.session && (canAutoStart || isPrimary))
          );
        });

        /* Skipped accounts */
        const skippedAccounts = accountsWithFarmer.filter(
          (account) => !executableList.some((item) => item.id === account.id),
        );

        /* Unused proxies */
        const unusedProxies = skippedAccounts
          .filter((account) => account.proxy)
          .map((account) => account.proxy);

        /* Assign unused proxies to executable accounts without proxy */
        executableList.forEach((account) => {
          if (account.proxy) {
            return;
          }

          const proxy = unusedProxies.shift();
          if (proxy) {
            account.proxy = proxy;
          }
        });

        /** Prepare accounts to be executed */
        this.utils
          .shuffle(executableList)
          .forEach((account) => this.prepare(account, true));

        /** Process queue */
        this.processQueue();

        /** Get results */
        const results = executableList.map((account) => {
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
            totalCount: accountsWithFarmer.length,
            executedCount: executableList.length,
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
