import { HiPlay, HiStop } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { memo } from "react";
import useAppContext from "@/hooks/useAppContext";
import { useRef } from "react";
import CronRunner from "@purrfect/shared/lib/CronRunner.js";
import useUserAgent from "@/hooks/useUserAgent";
import utils from "@/lib/utils";
import axios from "axios";
import BrowserLogger from "@purrfect/shared/lib/BrowserLogger";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useEffect } from "react";
import { useState } from "react";
import useMirroredCallback from "@/hooks/useMirroredCallback";

/**
 *
 * @param {Object} param0
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} param0.FarmerClass
 * @param {Function} param0.joinTelegramLink
 * @param {string} param0.userAgent
 * @returns {import("@purrfect/shared/lib/BaseFarmer.js").default}
 */
const createInstance = ({
  FarmerClass,
  logger,
  userAgent,
  controller,
  telegramClient,
}) => {
  return new (class extends FarmerClass {
    constructor() {
      super();
      this.api = axios.create();
      this.utils = utils;
      this.client = telegramClient;
      this.logger = logger;
      this.userAgent = userAgent;
      this.controller = controller;

      if (import.meta.env.VITE_WHISKER) {
        this.api.defaults.headers.common[
          "x-whisker-origin"
        ] = `https://${this.constructor.host}`;
      }

      this.registerDelayInterceptor();
      this.configureApi?.();
    }

    /** Can Join Telegram Link */
    canJoinTelegramLink(link) {
      return Boolean(this.client.ref.current);
    }

    /** Join Telegram Link */
    joinTelegramLink(link) {
      return this.client.ref.current.joinTelegramLink(link);
    }

    registerDelayInterceptor() {
      if (this.constructor.apiDelay) {
        this.api.interceptors.request.use(async (config) => {
          await this.utils.delay(this.constructor.apiDelay);
          return config;
        });
      }
    }

    async setAuth() {
      const auth = await this.fetchAuth();
      const headers = await this.getAuthHeaders(auth);
      this.api.defaults.headers = {
        ...this.api.defaults.headers,
        ...headers,
      };
      return this;
    }

    async run() {
      await this.updateWebAppData();
      await this.setAuth();
      await this.fetchMeta();
      await this.start(this.controller.signal);
    }

    async updateWebAppData() {
      const { url } = await this.client.ref.current.getWebview(
        this.constructor.telegramLink
      );
      const { initData } = this.utils.extractTgWebAppData(url);

      this.setTelegramWebApp({
        initData,
        initDataUnsafe: this.utils.getInitDataUnsafe(initData),
      });
    }
  })();
};

function TinyFly() {
  const logger = useMemo(() => new BrowserLogger(), []);
  const { drops, telegramClient } = useAppContext();
  const userAgent = useUserAgent();

  const runnerRef = useRef(null);
  const terminalRef = useRef(null);
  const controllerRef = useRef(null);

  const [started, setStarted] = useState(false);
  const startedRef = useRef(started);
  startedRef.current = started;

  const [stopTinyFly] = useMirroredCallback(
    `tiny-fly-stop`,
    () => {
      if (!startedRef.current) {
        return;
      }
      controllerRef.current?.abort();
      controllerRef.current = null;
      setStarted(false);
    },
    [setStarted]
  );

  const [startTinyFly] = useMirroredCallback(
    `tiny-fly-start`,
    () => {
      if (startedRef.current) {
        return;
      }
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const runner = new CronRunner("concurrent");
      runnerRef.current = runner;

      drops.forEach((drop) => {
        const { FarmerClass } = drop;
        const callback = async () => {
          if (controller.signal.aborted) return;

          const instance = createInstance({
            FarmerClass,
            logger,
            userAgent,
            controller,
            telegramClient,
          });

          await instance.run();
        };

        runner.register(
          FarmerClass.interval ?? "*/10 * * * *",
          callback,
          FarmerClass.title
        );
      });

      runner.start();
      controller.signal.addEventListener("abort", () => {
        runner.stop();
      });

      logger.clear();
      logger.info(`> Started Tiny Fly`);

      setStarted(true);
    },
    [drops, logger, stopTinyFly, setStarted]
  );

  const [, dispatchAndToggleTinyFly] = useMirroredCallback(
    `tiny-fly-toggle`,
    (status) => {
      if (typeof status === "boolean") {
        return status ? startTinyFly() : stopTinyFly();
      } else if (!started) {
        return startTinyFly();
      } else {
        return stopTinyFly();
      }
    },
    [started, startTinyFly, stopTinyFly]
  );

  /** Initialize Logger */
  useLayoutEffect(() => {
    logger.setElement(terminalRef.current);
    logger.success(`> Tiny Fly Initiated`);
  }, [logger]);

  /** Cleanup on unmount */
  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    []
  );

  return (
    <>
      <button
        onClick={() => dispatchAndToggleTinyFly(!started)}
        className={cn(
          "flex items-center justify-center gap-2 p-2",
          started ? "text-red-500" : "text-green-500"
        )}
      >
        {started ? (
          <HiStop className="size-5" />
        ) : (
          <HiPlay className="size-5" />
        )}
        {started ? "Stop" : "Start"}
      </button>
      <div
        ref={terminalRef}
        className="grow overflow-auto bg-black text-white p-2 font-mono whitespace-pre-wrap"
      />
    </>
  );
}

export default memo(TinyFly);
