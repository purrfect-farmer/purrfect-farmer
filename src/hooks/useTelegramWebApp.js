import { postPortMessage } from "@/lib/utils";
import { useCallback, useLayoutEffect, useMemo } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useMessageHandlers from "./useMessageHandlers";

/**
 * TelegramWebApp Hook
 * @param {string} telegramLink
 * @param {string} host
 * @returns
 */
export default function useTelegramWebApp(telegramLink, host) {
  const [telegramWebApp, setTelegramWebApp] = useState(null);
  const [port, setPort] = useState(null);
  const { messaging, farmerMode, telegramClient } = useAppContext();

  /** Reset TelegramWebApp */
  const resetTelegramWebApp = useCallback(() => {
    setTelegramWebApp(null);
    setPort(null);
  }, [setTelegramWebApp, setPort]);

  /** Configure TelegramWebApp from Message */
  const configureTelegramWebApp = useCallback(
    (message) => {
      /** Configure the App */
      setTelegramWebApp(message.data.telegramWebApp);
    },
    [setTelegramWebApp]
  );

  /** Handle Message */
  useMessageHandlers(
    useMemo(
      () => ({
        [`port-connected:mini-app:${host}`]: (port) => {
          setPort(port);
        },
        [`set-telegram-web-app:${host}`]: (message, port) => {
          configureTelegramWebApp(message, port);
        },
      }),
      [host, configureTelegramWebApp, setPort]
    )
  );

  /** Get Telegram WebApp from Session */
  useLayoutEffect(() => {
    if (farmerMode === "session" && telegramWebApp === null) {
      telegramClient.getTelegramWebApp(telegramLink).then((result) => {
        setTelegramWebApp(result);
      });
    }
  }, [
    farmerMode,
    telegramLink,
    telegramWebApp,
    setTelegramWebApp,
    telegramClient.getTelegramWebApp,
  ]);

  /** Get TelegramWebApp from Bot */
  useLayoutEffect(() => {
    if (telegramWebApp === null) {
      const port = messaging.ports
        .values()
        .find((port) => port.name === `mini-app:${host}`);

      if (port) {
        setPort(port);
        postPortMessage(port, {
          action: `get-telegram-web-app:${host}`,
        });
      }
    }
  }, [host, setPort, messaging.ports, telegramWebApp]);

  return useMemo(
    () => ({ port, telegramWebApp, setTelegramWebApp, resetTelegramWebApp }),
    [port, telegramWebApp, setTelegramWebApp, resetTelegramWebApp]
  );
}
