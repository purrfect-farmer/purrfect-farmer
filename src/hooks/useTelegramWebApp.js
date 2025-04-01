import { postPortMessage } from "@/lib/utils";
import { useCallback, useLayoutEffect, useMemo } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useMessageHandlers from "./useMessageHandlers";

export default function useTelegramWebApp(host) {
  const [telegramWebApp, setTelegramWebApp] = useState(null);
  const [port, setPort] = useState(null);
  const { messaging } = useAppContext();

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

  /** Get TelegramWebApp from Bot */
  useLayoutEffect(() => {
    const port = messaging.ports
      .values()
      .find((port) => port.name === `mini-app:${host}`);

    if (port) {
      setPort(port);
      postPortMessage(port, {
        action: `get-telegram-web-app:${host}`,
      });
    }
  }, [host, setPort, messaging.ports]);

  return useMemo(
    () => ({ port, telegramWebApp, setTelegramWebApp, resetTelegramWebApp }),
    [port, telegramWebApp, setTelegramWebApp, resetTelegramWebApp]
  );
}
