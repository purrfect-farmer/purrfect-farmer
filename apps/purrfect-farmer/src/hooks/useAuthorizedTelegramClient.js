import useAppContext from "@/hooks/useAppContext";
import { createTelegramClient } from "@/lib/createTelegramClient";
import {
  NoTelegramWebAccountError,
  connectTelegramWebClient,
  getTelegramClientFromSession,
} from "@/lib/telegramWebSession";
import { useCallback } from "react";
import useTelegramWebPort from "./useTelegramWebPort";
import useValuesMemo from "./useValuesMemo";
import { FARMER_MODE } from "@/constants/farmerMode";

/** Disposer used when the client is owned by the app and must outlive the caller */
const keepClientAlive = () => {};

/**
 * Acquire an authorized Telegram Client, whichever farmer mode is active.
 * `verify: false` skips the authorization check, so the caller can tell
 * a signed out session apart from a network failure.
 */
export default function useAuthorizedTelegramClient(app) {
  const { account, farmerMode, localTelegramSession, telegramClient } =
    useAppContext() || app;

  const { getLocalStorage } = useTelegramWebPort(app);

  /** Read this account's Telegram Web K entry, or null when it has none */
  const getTelegramWebAccount = useCallback(async () => {
    const currentLocalStorage = await getLocalStorage();
    const webAccount = currentLocalStorage[`account${account.index + 1}`];

    return webAccount ? JSON.parse(webAccount) : null;
  }, [getLocalStorage, account.index]);

  /** Get the already-authorized client from the Telegram Web session */
  const getClientFromTelegramWeb = useCallback(
    async ({ verify = true } = {}) => {
      const details = await getTelegramWebAccount();

      if (!details) {
        throw new NoTelegramWebAccountError();
      }

      if (!verify) {
        return connectTelegramWebClient(details);
      }

      const client = await getTelegramClientFromSession(details);

      if (!client) {
        throw new Error("Failed to create Telegram client from session.");
      }

      return client;
    },
    [getTelegramWebAccount],
  );

  /** Build a client from the stored local session, for signing other surfaces in */
  const getClientFromLocalSession = useCallback(async () => {
    if (!localTelegramSession) {
      throw new Error("There is no local Telegram session.");
    }

    if (farmerMode === FARMER_MODE.SESSION && telegramClient.ref.current) {
      const client = telegramClient.ref.current;

      /** The auth key is only populated once the client has connected */
      if (!client.connected) {
        await client.connect();
      }

      return { client, dispose: keepClientAlive };
    }

    const client = createTelegramClient(localTelegramSession);
    await client.connect();

    return {
      client,
      dispose: () => client.destroy().catch(() => {}),
    };
  }, [farmerMode, localTelegramSession, telegramClient]);

  /** Acquire a Client */
  const acquire = useCallback(
    async ({ verify = true } = {}) => {
      /** Session mode never falls back to Telegram Web, client or not */
      if (farmerMode === FARMER_MODE.SESSION) {
        return getClientFromLocalSession();
      }

      /** Rebuild a throwaway client from Telegram Web */
      const client = await getClientFromTelegramWeb({ verify });

      return {
        client,
        dispose: () => client.destroy().catch(() => {}),
      };
    },
    [farmerMode, getClientFromLocalSession, getClientFromTelegramWeb],
  );

  return useValuesMemo({
    acquire,
    getClientFromTelegramWeb,
    getClientFromLocalSession,
  });
}
