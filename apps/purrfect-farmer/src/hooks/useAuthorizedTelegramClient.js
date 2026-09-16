import useAppContext from "@/hooks/useAppContext";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { getTelegramClientFromSession } from "@/lib/telegramWebSession";
import { postPortMessage } from "@/utils";
import { useCallback } from "react";
import useValuesMemo from "./useValuesMemo";

/** Disposer used when the client is owned by the app and must outlive the caller */
const keepClientAlive = () => {};

/** Acquire an authorized Telegram Client, whichever farmer mode is active */
export default function useAuthorizedTelegramClient() {
  const {
    account,
    farmerMode,
    localTelegramSession,
    telegramClient,
    messaging,
    closeTab,
    setActiveTab,
  } = useAppContext();

  /** Close Telegram Web Tabs */
  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
  }, [closeTab]);

  /** Get Telegram Web Local Storage */
  const getTelegramWebLocalStorage = useCallback(() => {
    return new Promise((resolve) => {
      messaging.handler.once(`port-connected:telegram-web-k`, async (port) => {
        /** Get Telegram Web Local Storage */
        const telegramWebLocalStorage = await postPortMessage(port, {
          action: "get-local-storage",
        }).then((response) => response.data);

        /** Close Telegram Web */
        closeTelegramWeb();

        /** Resolve */
        resolve(telegramWebLocalStorage);
      });

      /** Open Telegram Web  */
      setActiveTab("telegram-web-k");
    });
  }, [messaging.handler, setActiveTab, closeTelegramWeb]);

  /** Get the already-authorized client from the Telegram Web session */
  const getClientFromTelegramWeb = useCallback(async () => {
    /** Close Telegram Web Tabs */
    await closeTelegramWeb();

    /** Get Data */
    const currentLocalStorage = await getTelegramWebLocalStorage();
    console.log(
      "Current Telegram Web Local Storage Retrieved:",
      currentLocalStorage,
    );

    /** Get Account Data */
    const accountIndex = account.index + 1;
    const webAccount = currentLocalStorage[`account${accountIndex}`];

    if (!webAccount) {
      throw new Error("Telegram Web account was not found.");
    }

    /* Parse Details */
    const details = JSON.parse(webAccount);
    console.log("Web Account Details:", details);

    /* Create Client from Session */
    const client = await getTelegramClientFromSession(details);

    if (!client) {
      throw new Error("Failed to create Telegram client from session.");
    }

    return client;
  }, [closeTelegramWeb, getTelegramWebLocalStorage, account]);

  /** Build a client from the stored local session, for signing other surfaces in */
  const getClientFromLocalSession = useCallback(async () => {
    if (!localTelegramSession) {
      throw new Error("There is no local Telegram session.");
    }

    if (farmerMode === "session" && telegramClient.ref.current) {
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
  const acquire = useCallback(async () => {
    if (farmerMode === "session" && telegramClient.ref.current) {
      /** Reuse the app's client, connecting it the way `execute` does */
      const client = telegramClient.ref.current;
      await client.connect();

      return { client, dispose: keepClientAlive };
    }

    /** Rebuild a throwaway client from Telegram Web */
    const client = await getClientFromTelegramWeb();

    return {
      client,
      dispose: () => client.destroy().catch(() => {}),
    };
  }, [farmerMode, telegramClient, getClientFromTelegramWeb]);

  return useValuesMemo({
    acquire,
    getClientFromTelegramWeb,
    getClientFromLocalSession,
  });
}
