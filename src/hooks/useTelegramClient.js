import { createTelegramClient } from "@/lib/createTelegramClient";
import { useEffect } from "react";
import { useRef } from "react";

import useLocalTelegramSession from "./useLocalTelegramSession";

export default function useTelegramClient(farmerMode) {
  const [session] = useLocalTelegramSession();
  const clientRef = useRef(null);

  useEffect(() => {
    if (session && farmerMode === "session") {
      /** Create Client */
      const client = createTelegramClient(session);

      /** Set Ref */
      clientRef.current = client;

      /** Connect */
      client.connect();

      return () => {
        client.destroy();
        clientRef.current = null;
      };
    }
  }, [session, farmerMode]);

  return clientRef;
}
