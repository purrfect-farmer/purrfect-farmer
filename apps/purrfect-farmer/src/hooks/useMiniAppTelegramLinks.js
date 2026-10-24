import { useCallback } from "react";
import { useMemo } from "react";

import useMessageHandlers from "./useMessageHandlers";

/** Open the t.me links of mini-apps running in their own tabs, telling them the farmer took it */
export default function useMiniAppTelegramLinks(core) {
  const { messaging, openTelegramLink } = core;

  const handleTelegramLink = useCallback(
    (message, port) => {
      openTelegramLink(message.data.url);
      port.postMessage({ id: message.id, type: "response", data: true });
    },
    [openTelegramLink],
  );

  useMessageHandlers(
    useMemo(
      () => ({ ["farmer:open-telegram-link"]: handleTelegramLink }),
      [handleTelegramLink],
    ),
    messaging,
  );
}
