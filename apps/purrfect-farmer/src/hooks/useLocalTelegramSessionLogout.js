import toast from "react-hot-toast";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { useCallback } from "react";

import useAppContext from "./useAppContext";
import { FARMER_MODE } from "@/constants/farmerMode";

/** A hook for logging out the local Telegram session */
export default function useLocalTelegramSessionLogout() {
  const {
    telegramClient,
    configureSettings,
    localTelegramSession,
    setLocalTelegramSession,
  } = useAppContext();

  return useCallback(
    () =>
      toast
        .promise(
          (async function () {
            /** @type {import("@/lib/TelegramWebClient").default} */
            const client =
              telegramClient.ref.current ||
              createTelegramClient(localTelegramSession);

            /** Remove Session */
            setLocalTelegramSession(null);

            /** Reset Farmer Mode */
            configureSettings("farmerMode", FARMER_MODE.WEB, false);

            try {
              /** Try to reconnect */
              if (!client.connected) {
                await client.connect();
              }

              /** Logout */
              await client.logout();

              /** Destroy */
              await client.destroy();
            } catch (e) {
              console.error(e);
            }
          })(),
          {
            success: "Successfully logged out...",
            error: "Error...",
            loading: "Logging out...",
          },
        )
        .catch((e) => {
          console.error(e);
        }),
    [
      telegramClient.ref,
      configureSettings,
      localTelegramSession,
      setLocalTelegramSession,
    ],
  );
}
