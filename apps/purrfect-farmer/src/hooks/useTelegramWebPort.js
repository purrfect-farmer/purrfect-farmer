import TelegramIcon from "@/assets/images/telegram-logo.svg";
import { Browser } from "@/core/tabs";
import { createElement } from "react";
import { postPortMessage } from "@/utils";
import { useCallback } from "react";

import useAppContext from "./useAppContext";
import useValuesMemo from "./useValuesMemo";

const PORT_EVENT = "port-connected:telegram-web-k";

/** Time an operation may take, from opening the tab to its last answer */
const PORT_TIMEOUT = 60_000;

/** Telegram Web K has one port, so operations on it run one at a time */
let portQueue = Promise.resolve();

/** Open Telegram Web K, or another origin's Web K at `url`, to use its port */
export default function useTelegramWebPort(app) {
  const {
    settings,
    messaging,
    closeTab,
    pushTab,
    setActiveTab,
    configureSettings,
  } = useAppContext() || app;

  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
    closeTab("telegram-web-browser");
  }, [closeTab]);

  const openTelegramWeb = useCallback(
    (url) => {
      pushTab(
        {
          id: "telegram-web-browser",
          title: "Telegram Web",
          icon: TelegramIcon,
          component: createElement(Browser, {
            url,
          }),
          reloadedAt: Date.now(),
        },
        true,
      );
    },
    [pushTab],
  );

  /** Wait for the port, run the handler on it, then close the tab */
  const runOnPort = useCallback(
    (handler, url) =>
      new Promise((resolve, reject) => {
        const finish = () => {
          clearTimeout(timeout);
          messaging.handler.off(PORT_EVENT, onPort);
          closeTelegramWeb();
        };

        const onPort = (port) => {
          messaging.handler.off(PORT_EVENT, onPort);

          Promise.resolve()
            .then(() => handler(port))
            .then(resolve, reject)
            .finally(finish);
        };

        const timeout = setTimeout(() => {
          finish();
          reject(new Error("Telegram Web did not respond in time."));
        }, PORT_TIMEOUT);

        messaging.handler.on(PORT_EVENT, onPort);

        if (url) {
          openTelegramWeb(url);
        } else {
          setActiveTab("telegram-web-k");
        }
      }),
    [messaging.handler, setActiveTab, openTelegramWeb, closeTelegramWeb],
  );

  /** Queue an operation on a freshly opened Telegram Web K port */
  const withTelegramWebPort = useCallback(
    (handler, url) => {
      const run = async () => {
        /** Telegram Web tabs only mount once onboarding is done */
        if (!settings.onboarded) {
          await configureSettings("onboarded", true, false);
        }

        /** A stale tab holds the port and the next open never connects */
        await closeTelegramWeb();

        return runOnPort(handler, url);
      };

      const result = portQueue.then(run, run);
      portQueue = result.catch(() => {});

      return result;
    },
    [settings.onboarded, configureSettings, closeTelegramWeb, runOnPort],
  );

  const getLocalStorage = useCallback(
    (url) =>
      withTelegramWebPort(
        (port) =>
          postPortMessage(port, { action: "get-local-storage" }).then(
            (response) => response.data,
          ),
        url,
      ),
    [withTelegramWebPort],
  );

  const setLocalStorage = useCallback(
    (data, url) =>
      withTelegramWebPort(
        (port) => postPortMessage(port, { action: "set-local-storage", data }),
        url,
      ),
    [withTelegramWebPort],
  );

  return useValuesMemo({
    closeTelegramWeb,
    openTelegramWeb,
    withTelegramWebPort,
    getLocalStorage,
    setLocalStorage,
  });
}
