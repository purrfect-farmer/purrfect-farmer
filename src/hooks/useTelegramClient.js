import TelegramWebClient from "@/lib/TelegramWebClient";
import TelegramWorkerClient from "@/lib/TelegramWorkerClient";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { customLogger } from "@/lib/utils";
import { useCallback, useLayoutEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useTelegramClient(mode, session) {
  const ref = useRef(null);
  const hasSession = Boolean(session);
  const [connected, setConnected] = useState(false);

  const execute = useCallback(
    /**
     * Executes a callback with the Telegram Client instance.
     *
     * @param {(client: TelegramWebClient | TelegramWorkerClient) => any} callback - The function to execute with the client.
     * @returns {Promise<any>} The result of the callback.
     */
    async (callback) => {
      if (ref.current === null) {
        throw new Error("No Telegram Client!");
      }

      return callback(ref.current);
    },
    []
  );

  /** Start Bot from Link */
  const startBotFromLink = useCallback(
    (options) => execute((client) => client.startBotFromLink(options)),
    [execute]
  );

  /** Get Webview */
  const getWebview = useCallback(
    (link) => execute((client) => client.getWebview(link)),
    [execute]
  );

  /** Get Telegram WebApp */
  const getTelegramWebApp = useCallback(
    (link) => execute((client) => client.getTelegramWebApp(link)),
    [execute]
  );

  /** Join Telegram Link */
  const joinTelegramLink = useCallback(
    (link) => execute((client) => client.joinTelegramLink(link)),
    [execute]
  );

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

      /** Set Connection State */
      setConnected(client.connected);

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
    execute,
    getWebview,
    getTelegramWebApp,
    joinTelegramLink,
    startBotFromLink,
  });
}
