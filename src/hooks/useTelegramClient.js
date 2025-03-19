import { createTelegramClient } from "@/lib/createTelegramClient";
import { useEffect } from "react";
import { useRef } from "react";

import useLocalTelegramSession from "./useLocalTelegramSession";

export default function useTelegramClient(settings) {
  const [session] = useLocalTelegramSession();
  const clientRef = useRef(null);

  useEffect(() => {
    if (session && settings.farmerMode === "session") {
      /** Create Client */
      const client = createTelegramClient(
        settings.telegramApiId,
        settings.telegramApiHash,
        session
      );

      /** Set Ref */
      clientRef.current = client;

      client.start();

      return () => {
        client.destroy();
        clientRef.current = null;
      };
    }
  }, [
    session,
    settings.farmerMode,
    settings.telegramApiId,
    settings.telegramApiHash,
  ]);

  return clientRef;
}
