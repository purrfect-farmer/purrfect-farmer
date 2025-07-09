import { postPortMessage } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { useEffect } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useMessageHandlers from "./useMessageHandlers";

/**
 * TelegramWebApp Hook
 */
export default function useTelegramWebApp({ host, telegramLink }) {
  const [telegramWebApp, setTelegramWebApp] = useState(null);
  const [port, setPort] = useState(null);
  const { settings, messaging, farmerMode, telegramClient } = useAppContext();

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
          if (!telegramWebApp) {
            configureTelegramWebApp(message, port);
          }
        },
      }),
      [host, telegramWebApp, configureTelegramWebApp, setPort]
    )
  );

  /** Get Telegram WebApp from Storage, Session or Bot */
  useEffect(() => {
    if (telegramWebApp) {
      return;
    }

    /** Set From Port */
    const setWebAppFromPort = () => {
      const port = messaging.ports
        .values()
        .find((port) => port.name === `mini-app:${host}`);

      if (port) {
        setPort(port);
        postPortMessage(port, {
          action: `get-telegram-web-app:${host}`,
        });
      }
    };

    /** Set From Session */
    const setWebAppFromSession = () => {
      telegramClient.ref.current
        .getTelegramWebApp(telegramLink)
        .then((result) => {
          setTelegramWebApp(result);
        });
    };

    /** Set From Session or Port */
    const setWebAppFromSessionOrPort = () => {
      if (farmerMode === "session" && settings.autoStartBot) {
        setWebAppFromSession();
      } else {
        setWebAppFromPort();
      }
    };

    /** Get Web App */
    setWebAppFromSessionOrPort();
  }, [
    host,
    setPort,
    farmerMode,
    telegramLink,
    telegramWebApp,
    setTelegramWebApp,
    messaging.ports,
    settings.autoStartBot,
  ]);

  return useMemo(() => ({ port, telegramWebApp }), [port, telegramWebApp]);
}
