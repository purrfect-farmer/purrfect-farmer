import { CookieJar } from "tough-cookie";
import ConsoleLogger from "@purrfect/shared/lib/ConsoleLogger.js";
import GramClient from "../lib/telegram/GramClient.js";
import PrimaryLink from "./runner/PrimaryLink.js";
import RunnerQueue from "./runner/RunnerQueue.js";
import app from "../config/app.js";
import bot from "../lib/bot.js";
import captcha from "../lib/captcha.js";
import utils from "../lib/utils.js";
import {
  createFarmerRecord,
  recordFailure,
  recordSuccess,
} from "./runner/farmer-record.js";
import { getCookies, restoreCookies, setupHttp } from "./runner/http.js";
import { getRunResult, runFarmer } from "./runner/run.js";
import { logRunnerConfig, resolveRunnerConfig } from "./runner/config.js";
import { REFERRER_MODE } from "../enums/referrer-mode.js";
import { createFarmerStorage } from "./runner/storage.js";
import { saveSerialized } from "../lib/db-write.js";
import { isTransientError } from "./runner/errors.js";
import { ensureUserAgent, resolveUserAgent } from "./runner/user-agent.js";

/**
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} FarmerClass
 */
export default function createRunner(FarmerClass) {
  /** Runner settings from the environment */
  const config = resolveRunnerConfig(FarmerClass);
  logRunnerConfig(FarmerClass, config);

  return class Runner extends FarmerClass {
    static utils = utils;
    static enabled = config.enabled;
    static autoStart = config.autoStart;
    static threadId = config.threadId;
    static skipExecutionOfNewAccount = config.skipExecutionOfNewAccount;
    static telegramLink = config.telegramLink;
    static referrerMode = config.referrerMode;
    static primaryAccountId = config.primaryAccountId;
    static interval = config.interval;
    static runners = new Map();
    static terminated = new Set();
    static referralLinks = new Map();
    static logger = new ConsoleLogger(process.env.NODE_ENV !== "production");
    static isTransientError = isTransientError;

    static {
      /** Primary account referral link */
      this.primaryLink = new PrimaryLink(this);

      /** Instances waiting to run */
      this.runQueue = new RunnerQueue(this);
    }

    constructor({ account, referralLink = null, scheduled = false } = {}) {
      super({ referralLink });
      this.debug = process.env.NODE_ENV !== "production";
      this.account = account;
      this.farmer = account.farmer;
      this.scheduled = scheduled;

      this.random = this.account.random(); // Seeded RNG

      /** Static logger and utils, the account's User-Agent, the captcha solver and the profile setting */
      this.configure({
        logger: this.constructor.logger,
        utils: this.constructor.utils,
        userAgent: resolveUserAgent(this.account, this.platform, this.random),
        captcha,
        allowProfileUpdates: app.allowProfileUpdates,
      });

      /** Cookie Jar */
      this.jar = this.cookies ? new CookieJar() : null;

      /** Proxy URL */
      this.proxy = this.account.proxy ? `http://${this.account.proxy}` : null;

      /** Agents, API and interceptors */
      setupHttp(this);

      /** Configure Telegram Web app */
      this.configureTelegramWebApp();

      /** Farmer row storage */
      this.configure({ storage: createFarmerStorage(this) });
    }

    /** Notify the server admin via the bot */
    async notifyAdmin(messages) {
      return bot?.sendAdminMessage(messages);
    }

    /** Get Cookies */
    async getCookies({ url }) {
      return getCookies(this.jar, url);
    }

    /** Restore Cookies */
    async restoreCookies() {
      return restoreCookies(this.jar, this.farmer.cookies || []);
    }

    /** Get Referral Link */
    async getReferralLink() {
      if (this.farmer && this.farmer.referralLink) {
        return this.farmer.referralLink;
      } else {
        const link = await super.getReferralLink();
        if (this.farmer) {
          this.farmer.referralLink = link;
          await saveSerialized(this.farmer);
        }
        return link;
      }
    }

    /** Create Farmer */
    async createFarmer() {
      return createFarmerRecord(this);
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

      /** Store the User-Agent on an account without one */
      await ensureUserAgent(this);

      const needsAuth = !this.cacheAuth || !this.farmer;

      /** Create Farmer */
      if (!this.farmer) {
        this.farmer = await this.createFarmer();
      }

      /** Update WebAppData */
      if (this.platform === "telegram" && this.account.session) {
        try {
          /** Create Telegram Client */
          this.configure({
            client: await GramClient.create(this.account.session),
          });
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
        await saveSerialized(this.farmer);
      }

      /** Update the primary farmer link */
      await this.constructor.primaryLink.update(this);

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
        this.configure({ telegramWebApp: this.farmer.telegramWebApp });
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

    /** Get and update the initData using the telegram link for this farmer */
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
          await recordFailure(this.farmer);
        }
      } catch (error) {
        this.logger.error("Error disconnecting farmer:", error);
      }
    }

    /** Reset error count */
    async resetErrorCount() {
      try {
        if (this.farmer) {
          await recordSuccess(this.farmer);
        }
      } catch (error) {
        this.logger.error("Error resetting error count:", error);
      }
    }

    /** Abort any running instance and exclude the account from future batches until `resume` */
    static terminate(id) {
      /** Exclude account from future batches */
      this.terminated.add(id);

      const instance = this.runners.get(id);
      if (instance) {
        instance.controller.abort();
      }
    }

    /** Allow a previously terminated account to be included in batches again */
    static resume(id) {
      this.terminated.delete(id);
    }

    /** Abort a running instance without excluding the account from future batches */
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
        /** A terminated instance was aborted deliberately so it is not a farming failure to report */
        if (instance.signal.aborted) {
          this.logger.info("Aborted farming account:", instance.account.id);
          return;
        }

        /** Transient errors are not the account's fault, so they must not count toward deactivating or banning it */
        if (this.deactivateOnError && !this.isTransientError(error)) {
          await instance.disconnect();
        }
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

    /** Get instance referral link */
    static getInstanceReferralLink() {
      if (this.referrerMode === REFERRER_MODE.SINGLE) {
        return this.primaryLink.get();
      } else {
        const links = Array.from(this.referralLinks.values());
        const random = this.utils.randomItem(links);

        return random || this.primaryLink.get();
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
        this.runQueue.push(instance);
      }
    }

    /** Get Result */
    static getResult(account) {
      return getRunResult(this, account);
    }

    /** Run the farmer for all subscribed accounts */
    static run(options) {
      return runFarmer(this, options);
    }
  };
}
