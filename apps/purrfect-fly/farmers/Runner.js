import { CookieJar } from "tough-cookie";
import userAgents, {
  regularMobileUserAgents,
} from "@purrfect/shared/resources/userAgents.js";

import ConsoleLogger from "@purrfect/shared/lib/ConsoleLogger.js";
import GramClient from "../lib/GramClient.js";
import PrimaryLink from "./runner/PrimaryLink.js";
import RunnerQueue from "./runner/RunnerQueue.js";
import bot from "../lib/bot.js";
import captcha from "../lib/captcha.js";
import db from "../db/models/index.js";
import selectAccounts, {
  assignUnusedProxies,
} from "./runner/selectAccounts.js";
import utils from "../lib/utils.js";
import {
  BAN_TRIGGER_COUNT,
  logRunnerConfig,
  resolveRunnerConfig,
} from "./runner/config.js";
import { getCookies, restoreCookies, setupHttp } from "./runner/http.js";
import { isTransientError } from "./runner/errors.js";

/**
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} FarmerClass
 */
export default function createRunner(FarmerClass) {
  /** Runner settings from the environment */
  const config = resolveRunnerConfig(FarmerClass);

  /** Log */
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

      /** Agents, API and interceptors */
      setupHttp(this);

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

    /** Get instance referral link */
    static getInstanceReferralLink() {
      if (this.referrerMode === "single") {
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
        /** Fetch accounts with farmer and active subscription */
        const accountsWithFarmer = await db.Account.findSubscribedWithFarmer(
          this.id,
        );

        /** Resolve the stored primary link before anything launches */
        await this.primaryLink.resolveFromDatabase();

        /** Decide which accounts run */
        const { primaryAccount, executable, skipped } = selectAccounts({
          accounts: accountsWithFarmer,
          user,
          terminated: this.terminated,
          primaryAccountId: this.primaryAccountId,
          platform: this.platform,
          autoStart: this.autoStart,
          referrerMode: this.referrerMode,
          primaryLinkResolved: this.primaryLink.resolved,
        });

        /** Notify when the primary account is missing (a single-user run never includes it) */
        if (!user) {
          if (primaryAccount) {
            this.primaryLink.warning = null;
          } else {
            await this.primaryLink.notifyMissing(
              this.primaryLink.getMissingReason(accountsWithFarmer),
            );
          }
        }

        /** Assign unused proxies to executable accounts without proxy */
        assignUnusedProxies(executable, skipped);

        /** Prepare accounts to be executed */
        this.utils
          .shuffle(executable)
          .forEach((account) => this.prepare(account, true));

        /** Process queue */
        this.runQueue.process();

        /** Get results */
        const results = executable.map((account) => {
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
            executedCount: executable.length,
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
