import { createTelegramClient } from "@/lib/createTelegramClient";
import { useEffect } from "react";
import { useRef } from "react";

export default function useTelegramClient(mode, session) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (mode === "session" && session) {
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
  }, [session, mode]);

  return clientRef;
}
