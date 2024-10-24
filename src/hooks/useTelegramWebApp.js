import { useCallback, useMemo } from "react";
import { useState } from "react";

import useMessageHandlers from "./useMessageHandlers";

export default function useTelegramWebApp(host) {
  const [telegramWebApp, setTelegramWebApp] = useState(null);
  const [port, setPort] = useState(null);

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

  return useMemo(
    () => ({ port, telegramWebApp, resetTelegramWebApp }),
    [port, telegramWebApp, resetTelegramWebApp]
  );
}
