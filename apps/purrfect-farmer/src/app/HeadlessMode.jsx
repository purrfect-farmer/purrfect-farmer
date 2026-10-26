import { cn, getPrimaryFarmerLinkStorageKey, getUserAgent } from "@/utils";
import defaultSettings from "@/core/defaultSettings";

import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import BrowserLogger from "@purrfect/shared/lib/BrowserLogger";
import CronRunner from "@purrfect/shared/lib/CronRunner";
import TelegramWebClient from "@/lib/TelegramWebClient";
import TerminalArea from "@/components/TerminalArea";
import { accountStorageKey } from "@/lib/storageKeys";
import axios from "axios";
import farmers from "@/core/farmers";
import storage from "@/lib/storage";
import { useEffect } from "react";
import { useRef } from "react";
import useSharedContext from "@/hooks/useSharedContext";
import utils from "@/utils/bundle";
import { withRetries } from "@purrfect/shared/utils/retry.js";

/** Headless Telegram Client */
class HeadlessTelegramClient extends TelegramWebClient {
  static instanceCache = new Map();

  static create(id, session) {
    if (this.instanceCache.has(id)) {
      return this.instanceCache.get(id);
    } else {
      const client = new this(session);
      this.instanceCache.set(id, client);
      return client;
    }
  }
}

/** The account's own settings over the default settings */
const getAccountSettings = (account) => ({
  ...defaultSettings,
  ...storage.get(accountStorageKey(account.id, "settings")),
});

/**
 *
 * @param {Object} param0
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} param0.FarmerClass
 * @returns {import("@purrfect/shared/lib/BaseFarmer.js").default}
 */
const createRunner = ({ FarmerClass, logger, captcha, controller }) => {
  const Runner = class extends FarmerClass {
    static runners = new Map();

    /**
     *
     * @param {Object} param0
     * @param {import("@purrfect/shared/lib/BaseTelegramWebClient.js").default} param0.client
     */
    constructor({ client, account, userAgent }) {
      super();
      this.account = account;

      /** The account's own settings */
      const settings = getAccountSettings(account);

      this.configure({
        api: axios.create(),
        utils,
        client,
        logger,
        captcha,
        userAgent,
        controller,
        allowProfileUpdates: Boolean(settings.allowProfileUpdates),
        taskRetries: settings.taskRetries,
      });

      this.registerDelayInterceptor();
      this.configureApi?.();
    }

    /** Get Cookies */
    async getCookies(options) {
      return await this.utils.getCookies(options);
    }

    /** Run Farmer */
    async run({ delayStartup = true } = {}) {
      /**
       * Random startup delay to avoid all accounts starting at the same time
       */
      const startupDelay = delayStartup
        ? Math.floor(Math.random() * 10 * this.constructor.startupDelay)
        : 0;

      /** Delay */
      if (startupDelay) {
        this.logger.info(
          `[${this.account.title}] Delaying startup by ${startupDelay} seconds...`,
        );

        await this.utils.delayForSeconds(startupDelay, {
          signal: this.controller.signal,
        });
      }

      await this.updateWebAppData();
      await this.setAuth();
      await this.fetchMeta();
      await this.start(this.controller.signal);
    }

    /** Initiate Farmer Instance */
    static async initiate(account) {
      const client = HeadlessTelegramClient.create(
        account.id,
        account.localTelegramSession,
      );
      /** The browser's shared User-Agent, which its net rules also send */
      const userAgent = await getUserAgent();

      /** How many times a failed run is bootstrapped again */
      const { farmerRetries } = getAccountSettings(account);

      return withRetries(
        farmerRetries,
        async (attempt) => {
          const instance = new this({ account, client, userAgent });
          await instance.run({ delayStartup: attempt === 1 });
          return instance;
        },
        {
          shouldRetry: () => !controller.signal.aborted,
          onRetry: (attempt, attempts, error) =>
            logger.warn(
              `[${account.title}] Re-bootstrapping ${this.title} (${attempt}/${attempts}): ${error.message}`,
            ),
        },
      );
    }

    /** Execute Farmer Instance */
    static execute(account) {
      if (!this.runners.has(account.id)) {
        this.runners.set(account.id, Date.now());
        this.initiate(account).finally(() => {
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

    /** Farm Accounts */
    static farm(accounts) {
      const results = accounts.map((account) => this.execute(account));
      return results;
    }
  };

  /** Configure primary link */
  Runner.configurePrimaryLink(
    storage.get(getPrimaryFarmerLinkStorageKey(FarmerClass.id)),
  );

  return Runner;
};

export default function HeadlessMode() {
  const terminalRef = useRef(null);
  const runnerRef = useRef(null);
  const { accounts, captcha, headlessFarmers, dispatchAndStopHeadlessMode } =
    useSharedContext();

  useEffect(() => {
    const controller = new AbortController();
    const logger = new BrowserLogger();

    const runner = new CronRunner("concurrent");
    runnerRef.current = runner;

    logger.setElement(terminalRef.current);
    logger.success(`> Headless Mode Initiated`);

    /** Get Available Accounts */
    const availableAccounts = accounts
      .map((account) => {
        const localTelegramSession = storage.get(
          `account-${account.id}:local-telegram-session`,
        );
        return { ...account, localTelegramSession };
      })
      .filter((account) => Boolean(account.localTelegramSession));

    /** Log Available Accounts */
    availableAccounts.forEach((account) => {
      logger.info(`> Preparing Account: ${account.title} (ID: ${account.id})`);
    });

    /** Create Runners */
    const runners = farmers
      .filter(
        (farmer) =>
          farmer.FarmerClass.interval && headlessFarmers.includes(farmer.id),
      )
      .map(({ FarmerClass }) => {
        return createRunner({
          FarmerClass,
          logger,
          captcha,
          controller,
        });
      });

    /** Register Runners */
    runners.forEach((Runner) => {
      const callback = async () => {
        if (controller.signal.aborted) return;
        await Runner.farm(availableAccounts);
      };

      /** Register Task */
      runner.register(
        Runner.interval ?? "*/10 * * * *",
        callback,
        Runner.title,
      );

      /** Initial Log */
      logger.success(`> ${Runner.title}`);
    });

    /** Cleanup on abort */
    controller.signal.addEventListener("abort", () => {
      /** Cleanup Headless Telegram Clients */
      [...HeadlessTelegramClient.instanceCache.values()].forEach((client) => {
        client.destroy();
      });

      /** Clear Instance Cache */
      HeadlessTelegramClient.instanceCache.clear();

      /** Stop Runner */
      runner.stop();
    });

    /** Start Runner */
    runner.start();

    /** Initial Instructions */
    logger.warn('> Click "Stop" to halt farming');

    return () => {
      controller.abort();
    };
  }, [accounts, captcha, headlessFarmers]);

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="shrink-0 flex flex-col p-2">
        {/* Heading */}
        <h2
          className={cn(
            "font-bold flex items-center justify-center gap-2",
            "font-turret-road text-lg text-orange-500",
          )}
        >
          <img src={AppIcon} alt="App Icon" className="size-6" />
          Headless Mode
        </h2>

        {/* Stop Button */}
        <button
          onClick={() => dispatchAndStopHeadlessMode()}
          className={cn("p-2 text-red-500")}
        >
          Stop
        </button>
      </div>

      {/* Terminal */}
      <TerminalArea ref={terminalRef} />
    </div>
  );
}
