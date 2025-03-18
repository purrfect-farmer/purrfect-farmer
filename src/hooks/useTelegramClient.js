import { createTelegramClient } from "@/lib/createTelegramClient";
import { useEffect } from "react";
import { useRef } from "react";

import useLocalTelegramSession from "./useLocalTelegramSession";

export default function useTelegramClient() {
  const [session] = useLocalTelegramSession();
  const clientRef = useRef(null);

  useEffect(() => {
    if (session) {
      /** Create Client */
      const client = createTelegramClient(session);

      /** Set Ref */
      clientRef.current = client;

      client.start();

      return () => {
        client.destroy();
        clientRef.current = null;
      };
    }
  }, [session]);

  return clientRef;
}
