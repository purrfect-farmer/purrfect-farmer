import TelegramWorkerClient from "@/lib/TelegramWorkerClient";
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
     * Executes a callback with the Telegram Worker Client instance.
     *
     * @param {(client: TelegramWorkerClient) => any} callback - The function to execute with the client.
     * @returns {Promise<any>} The result of the callback.
     */
    async (callback) => {
      if (ref.current === null) {
        throw new Error("No Telegram Worker Client!");
      }

      return callback(ref.current);
    },
    []
  );

  /** Start Bot from Link */
  const startBotFromLink = useCallback(
    (options) =>
      execute((client) => client.message("start-bot-from-link", options)),
    [execute]
  );

  /** Get Webview */
  const getWebview = useCallback(
    (link) => execute((client) => client.message("get-webview", link)),
    [execute]
  );

  /** Get Telegram WebApp */
  const getTelegramWebApp = useCallback(
    (link) => execute((client) => client.message("get-telegram-web-app", link)),
    [execute]
  );

  /** Join Telegram Link */
  const joinTelegramLink = useCallback(
    (link) => execute((client) => client.message("join-telegram-link", link)),
    [execute]
  );

  useLayoutEffect(() => {
    if (mode === "session" && session) {
      /** Log Session */
      customLogger("TG CLIENT SESSION", session);

      const client = new TelegramWorkerClient(session);

      /** Set Ref */
      ref.current = client;

      /** Set Connection State */
      setConnected(client.connected);

      /** Add Connected Event Handler */
      client.addEventListener("update-connection-state", (connected) =>
        setConnected(connected)
      );

      /** Connect */
      client.connect();

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
