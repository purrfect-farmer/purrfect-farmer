import TelegramIcon from "@/assets/images/telegram-logo.svg";
import { Browser } from "@/core/tabs";
import { createElement } from "react";
import { postPortMessage } from "@/utils";
import { useCallback } from "react";

import useAppContext from "./useAppContext";
import useValuesMemo from "./useValuesMemo";

/** Transfer Telegram Web local storage between origins */
export default function useTelegramWebTransfer() {
  const { messaging, closeTab, pushTab } = useAppContext();

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

  /** Open the URL, await the WebK port, run the handler, then close */
  const withTelegramWebPort = useCallback(
    (url, handler) => {
      return new Promise((resolve) => {
        /** Wait for Port */
        messaging.handler.once(`port-connected:telegram-web-k`, async (port) => {
          /** Handle Port */
          const result = await handler(port);

          /** Close Telegram Web */
          closeTelegramWeb();

          /** Resolve */
          resolve(result);
        });

        /** Open Telegram Web */
        openTelegramWeb(url);
      });
    },
    [messaging.handler, openTelegramWeb, closeTelegramWeb],
  );

  /** Get Telegram Web Local Storage */
  const getLocalStorage = useCallback(
    (url) =>
      withTelegramWebPort(url, (port) =>
        postPortMessage(port, {
          action: "get-local-storage",
        }).then((response) => response.data),
      ),
    [withTelegramWebPort],
  );

  /** Set Telegram Web Local Storage */
  const setLocalStorage = useCallback(
    (url, data) =>
      withTelegramWebPort(url, (port) =>
        postPortMessage(port, {
          action: "set-local-storage",
          data,
        }),
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
