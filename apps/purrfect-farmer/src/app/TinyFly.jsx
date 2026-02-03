import { HiPlay, HiStop } from "react-icons/hi2";

import BrowserLogger from "@purrfect/shared/lib/BrowserLogger";
import CronRunner from "@purrfect/shared/lib/CronRunner.js";
import TerminalArea from "@/components/TerminalArea";
import axios from "axios";
import { cn } from "@/utils";
import { memo } from "react";
import useAppContext from "@/hooks/useAppContext";
import { useCallback } from "react";
import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { useRef } from "react";
import { useState } from "react";
import useUserAgent from "@/hooks/useUserAgent";
import utils from "@/utils/bundle";

/**
 *
 * @param {Object} param0
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} param0.FarmerClass
 * @param {string} param0.userAgent
 * @returns {import("@purrfect/shared/lib/BaseFarmer.js").default}
 */
const createInstance = ({
  FarmerClass,
  logger,
  captcha,
  userAgent,
  controller,
  client,
}) => {
  const InstanceClass = class extends FarmerClass {
    constructor() {
      super();
      this.api = axios.create();
      this.utils = utils;
      this.logger = logger;
      this.captcha = captcha;
      this.userAgent = userAgent;
      this.controller = controller;
      this.client = client;

      this.registerDelayInterceptor();
      this.configureApi?.();
    }

    /** Get Cookies */
    async getCookies(options) {
      return await this.utils.getCookies(options);
    }

    async run() {
      await this.updateWebAppData();
      await this.setAuth();
      await this.fetchMeta();
      await this.start(this.controller.signal);
    }
  };

  return new InstanceClass();
};

function TinyFly() {
  const logger = useMemo(() => new BrowserLogger(), []);
  const { drops, telegramClient, captcha } = useAppContext();
  const client = telegramClient.ref.current;
  const userAgent = useUserAgent();

  const runnerRef = useRef(null);
  const terminalRef = useRef(null);
  const controllerRef = useRef(null);

  const [started, setStarted] = useState(false);
  const startedRef = useRef(started);
  startedRef.current = started;

  /** Reset Logger */
  const resetLogger = useCallback(() => {
    logger.clear();
    logger.success(`> Tiny Fly Initiated`);
    logger.info('> Click "Start" to begin farming');
  }, [logger]);

  /** Start Tiny Fly */
  const [startTinyFly] = useMirroredCallback(
    `tiny-fly-start`,
    () => {
      if (startedRef.current) {
        return;
      }
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      logger.clear();
      logger.info(`> Started Tiny Fly`);

      const runner = new CronRunner("concurrent");
      runnerRef.current = runner;

      /* Register Drops */
      drops.forEach((drop) => {
        const { FarmerClass } = drop;
        const callback = async () => {
          if (controller.signal.aborted) return;

          /* Create Farmer Instance */
          const instance = createInstance({
            FarmerClass,
            logger,
            captcha,
            userAgent,
            controller,
            client,
          });

          await instance.run();
        };

        /* Register Task */
        runner.register(
          FarmerClass.interval ?? "*/10 * * * *",
          callback,
          FarmerClass.title,
        );

        /* Initial Log */
        logger.success(`> ${FarmerClass.title}`);
      });

      /* Cleanup on abort */
      controller.signal.addEventListener("abort", () => {
        runner.stop();
      });

      /* Start Runner */
      runner.start();
      setStarted(true);

      /* Initial Instructions */
      logger.warn('> Click "Stop" to halt farming');
    },
    [drops, logger, captcha, client, setStarted],
  );

  /** Stop Tiny Fly */
  const [stopTinyFly] = useMirroredCallback(
    `tiny-fly-stop`,
    () => {
      if (!startedRef.current) {
        return;
      }
      controllerRef.current?.abort();
      controllerRef.current = null;
      setStarted(false);
      resetLogger();
    },
    [setStarted, resetLogger],
  );

  /** Toggle Tiny Fly */
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
    [started, startTinyFly, stopTinyFly],
  );

  /** Initialize Logger */
  useLayoutEffect(() => {
    logger.setElement(terminalRef.current);
    resetLogger();
  }, [logger, resetLogger]);

  /** Cleanup on unmount */
  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  return (
    <>
      <button
        onClick={() => dispatchAndToggleTinyFly(!started)}
        className={cn(
          "flex items-center justify-center gap-2 p-2",
          started ? "text-red-500" : "text-green-500",
        )}
      >
        {started ? (
          <HiStop className="size-5" />
        ) : (
          <HiPlay className="size-5" />
        )}
        {started ? "Stop" : "Start"}
      </button>
      <TerminalArea ref={terminalRef} />
    </>
  );
}

export default memo(TinyFly);
