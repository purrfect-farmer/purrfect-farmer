import { createTelegramClient } from "@/lib/createTelegramClient";
import { customLogger } from "@/lib/utils";
import { useLayoutEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useTelegramClient(mode, session, setSession) {
  const ref = useRef(null);
  const hasSession = Boolean(session);
  const [authorized, setAuthorized] = useState(false);

  /** Initiate Client */
  useLayoutEffect(() => {
    if (mode === "session" && session) {
      /** Log Session */
      customLogger("TG CLIENT SESSION", session);

      /** Create Client */
      const client = createTelegramClient(session);

      /** Add Connected Event Handler */
      client.onUserIsAuthorized((authorized) => {
        if (authorized) {
          setAuthorized(authorized);
        } else {
          setSession(null);
        }
      });

      /** Connect */
      client.connect();

      /** Set Ref */
      ref.current = client;

      /** Set Authorized State */
      setAuthorized(client.authorized);

      return () => {
        client?.destroy();
        ref.current = null;
        setAuthorized(false);
      };
    }
  }, [session, mode, setSession, setAuthorized]);

  return useValuesMemo({
    ref,
    hasSession,
    authorized,
  });
}
