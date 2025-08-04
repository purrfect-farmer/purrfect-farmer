import { createTelegramClient } from "@/lib/createTelegramClient";
import { customLogger } from "@/lib/utils";
import { useLayoutEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useTelegramClient(mode, session) {
  const ref = useRef(null);
  const hasSession = Boolean(session);
  const [connected, setConnected] = useState(false);

  /** Initiate Client */
  useLayoutEffect(() => {
    if (mode === "session" && session) {
      /** Log Session */
      customLogger("TG CLIENT SESSION", session);

      /** Create Client */
      const client = createTelegramClient(session);

      /** Add Connected Event Handler */
      client.onConnectionState((connected) => setConnected(connected));

      /** Connect */
      client.connect();

      /** Set Ref */
      ref.current = client;

      return () => {
        client?.destroy();
        ref.current = null;
        setConnected(false);
      };
    }
  }, [session, mode, setConnected]);

  return useValuesMemo({
    ref,
    hasSession,
    connected,
  });
}
