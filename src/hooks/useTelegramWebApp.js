import { postPortMessage } from "@/lib/utils";
import { useCallback, useEffect, useMemo } from "react";
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
    (message, port) => {
      /** Configure the App */
      setTelegramWebApp(message.data.telegramWebApp);

      /** Terminate Web App Dispatch */
      port.postMessage({
        action: "terminate-web-app-dispatch",
      });
    },
    [setTelegramWebApp]
  );

  /** Handle Message */
  useMessageHandlers(
    useMemo(
      () => ({
        [`set-port:${host}`]: (message, port) => {
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
  useEffect(() => {
    const port = messaging.ports
      .values()
      .find((port) => port.name === `mini-app:${host}`);

    if (port) {
      setPort(port);
      postPortMessage(port, {
        action: `get-telegram-web-app:${host}`,
      });
    }
  }, [setPort, host]);

  return useMemo(
    () => ({ port, telegramWebApp, resetTelegramWebApp }),
    [port, telegramWebApp, resetTelegramWebApp]
  );
}
