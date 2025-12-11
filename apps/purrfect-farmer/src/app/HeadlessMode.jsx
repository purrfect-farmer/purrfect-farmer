import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import useSharedContext from "@/hooks/useSharedContext";
import { cn } from "@/lib/utils";
import BrowserLogger from "@purrfect/shared/lib/BrowserLogger";
import { useRef } from "react";
import { useEffect } from "react";
import utils from "@/lib/utils";
import CronRunner from "@purrfect/shared/lib/CronRunner";
import axios from "axios";
import userAgents from "@purrfect/shared/resources/userAgents";
import TelegramWebClient from "@/lib/TelegramWebClient";
import seedrandom from "seedrandom";
import farmers from "@/core/farmers";
import Container from "@/components/Container";
import storage from "@/lib/storage";

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

/**
 *
 * @param {Object} param0
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} param0.FarmerClass
 * @returns {import("@purrfect/shared/lib/BaseFarmer.js").default}
 */
const createRunner = ({ FarmerClass, logger, captcha, controller }) => {
  return class extends FarmerClass {
    static runners = new Map();

    /**
     *
     * @param {Object} param0
     * @param {import("@purrfect/shared/lib/BaseTelegramWebClient.js").default} param0.client
     */
    constructor({ client, account }) {
      super();
      this.api = axios.create();
      this.utils = utils;
      this.account = account;
      this.client = client;
      this.logger = logger;
      this.captcha = captcha;
      this.random = seedrandom(account.id);
      this.userAgent =
        userAgents[Math.floor(this.random() * userAgents.length)];
      this.controller = controller;

      this.registerDelayInterceptor();
      this.configureApi?.();
    }

    /** Get Cookies */
    async getCookies(options) {
      return await this.utils.getCookies(options);
    }

    /** Register Delay Interceptor */
    registerDelayInterceptor() {
      if (this.constructor.apiDelay) {
        this.api.interceptors.request.use(async (config) => {
          await this.utils.delay(this.constructor.apiDelay);
          return config;
        });
      }
    }

    /** Set Auth */
    async setAuth() {
      const auth = await this.fetchAuth();
      const headers = await this.getAuthHeaders(auth);
      this.api.defaults.headers = {
        ...this.api.defaults.headers,
        ...headers,
      };
      return this;
    }

    /** Run Farmer */
    async run() {
      /**
       * Random startup delay to avoid all accounts starting at the same time
       */
      const startupDelay = Math.floor(
        this.random() * this.constructor.startupDelay
      );

      /** Delay */
      if (startupDelay) {
        this.logger.info(
          `[${this.account.title}] Delaying startup by ${startupDelay} seconds...`
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

    /** Update Web App Data */
    async updateWebAppData() {
      if (!this.constructor.telegramLink) return;

      await this.client.connect();

      const { url } = await this.client.getWebview(
        this.constructor.telegramLink
      );
      const { initData } = this.utils.extractTgWebAppData(url);

      this.setTelegramWebApp({
        initData,
        initDataUnsafe: this.utils.getInitDataUnsafe(initData),
      });
    }

    /** Initiate Farmer Instance */
    static async initiate(account) {
      const client = HeadlessTelegramClient.create(
        account.id,
        account.localTelegramSession
      );
      const instance = new this({ account, client });
      await instance.run();
      return instance;
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
};

export default function HeadlessMode() {
  const scrollRef = useRef(null);
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
    logger.setScrollElement(scrollRef.current);
    logger.success(`> Headless Mode Initiated`);

    /** Get Available Accounts */
    const availableAccounts = accounts
      .map((account) => {
        const localTelegramSession = storage.get(
          `account-${account.id}:local-telegram-session`
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
      .filter((farmer) => headlessFarmers.includes(farmer.id))
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
        Runner.title
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
            "font-turret-road text-lg text-orange-500"
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
      <div
        ref={scrollRef}
        className={cn("grow overflow-auto bg-black text-white")}
      >
        <Container
          ref={terminalRef}
          className={cn("font-mono whitespace-pre-wrap wrap-break-word p-2")}
        />
      </div>
    </div>
  );
}
