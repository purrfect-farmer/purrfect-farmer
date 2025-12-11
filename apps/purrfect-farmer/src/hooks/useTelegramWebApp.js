import { extractInitDataUnsafe, postPortMessage } from "@/utils";
import { isAfter, subMinutes } from "date-fns";
import { useCallback, useMemo } from "react";
import { useEffect } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useChromeStorageKey from "./useChromeStorageKey";
import useMessageHandlers from "./useMessageHandlers";
import storage from "@/lib/storage";

/**
 * TelegramWebApp Hook
 */
export default function useTelegramWebApp({
  id,
  host,
  enabled = true,
  telegramLink,
  cacheTelegramWebApp,
}) {
  const { settings, messaging, farmerMode, telegramClient } = useAppContext();
  const [telegramWebApp, setTelegramWebApp] = useState(null);
  const [port, setPort] = useState(null);

  /** Telegram Hash */
  const telegramHash = telegramWebApp?.initDataUnsafe?.hash;

  /** Telegram User */
  const telegramUser = telegramWebApp?.initDataUnsafe?.user;

  /** WebApp Chrome Storage Key */
  const webAppChromeStorageKey = useChromeStorageKey(
    `farmer-telegram-web-app:${id}`
  );

  /** Reset TelegramWebApp */
  const resetTelegramWebApp = useCallback(async () => {
    await storage.remove(webAppChromeStorageKey);
    await setTelegramWebApp(null);
    await setPort(null);
  }, [webAppChromeStorageKey, setTelegramWebApp, setPort]);

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

  /** Save WebApp in Storage */
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (cacheTelegramWebApp && telegramWebApp !== null) {
      const { initData, platform, version } = telegramWebApp;
      storage.set(webAppChromeStorageKey, {
        initData,
        platform,
        version,
      });
    }
  }, [enabled, cacheTelegramWebApp, telegramWebApp, webAppChromeStorageKey]);

  /** Get Telegram WebApp from Storage, Session or Bot */
  useEffect(() => {
    if (!enabled || telegramWebApp) {
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
    if (cacheTelegramWebApp === false) {
      setWebAppFromSessionOrPort();
    } else {
      const result = storage.get(webAppChromeStorageKey, null);

      if (result) {
        const initDataUnsafe = extractInitDataUnsafe(result.initData);

        /** Ensure initData is recent */
        if (
          isAfter(
            new Date(initDataUnsafe["auth_date"] * 1000),
            subMinutes(new Date(), 10)
          )
        ) {
          return setTelegramWebApp({
            ...result,
            initDataUnsafe,
          });
        }
      }

      return setWebAppFromSessionOrPort();
    }
  }, [
    host,
    setPort,
    enabled,
    farmerMode,
    telegramLink,
    telegramWebApp,
    setTelegramWebApp,
    cacheTelegramWebApp,
    webAppChromeStorageKey,
    messaging.ports,
    settings.autoStartBot,
  ]);

  return {
    port,
    telegramWebApp,
    telegramHash,
    telegramUser,
    setTelegramWebApp,
    resetTelegramWebApp,
  };
}
