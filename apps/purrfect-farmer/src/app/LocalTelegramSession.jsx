import Alert from "@/components/Alert";
import LocalTelegramSessionIcon from "@/assets/images/local-telegram-session.png?format=webp&w=192";
import TelegramLogin from "@/partials/TelegramLogin";
import TelegramWebClient from "@/lib/TelegramWebClient";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/lib/utils";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { useCallback } from "react";

export default function LocalTelegramSession() {
  const {
    telegramClient,
    configureSettings,
    localTelegramSession,
    setLocalTelegramSession,
  } = useAppContext();

  const handleLogoutButtonClick = () => {
    toast
      .promise(
        (async function () {
          /** @type {TelegramWebClient} */
          const client =
            telegramClient.ref.current ||
            createTelegramClient(localTelegramSession);

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

          /** Remove Session */
          setLocalTelegramSession(null);

          /** Reset Farmer Mode */
          configureSettings("farmerMode", "web", false);
        })(),
        {
          success: "Successfully logged out...",
          error: "Error...",
          loading: "Logging out...",
        }
      )
      .catch((e) => {
        console.error(e);
      });
  };

  /** Login Success */
  const handleLoginSuccess = useCallback(
    (session) => {
      /** Set Session */
      setLocalTelegramSession(session);

      /** Configure Settings */
      configureSettings("farmerMode", "session", false);
    },
    [configureSettings, setLocalTelegramSession]
  );

  return (
    <div
      className={cn(
        "flex flex-col justify-center min-w-0 min-h-0 gap-4 p-4 grow"
      )}
    >
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={LocalTelegramSessionIcon} className="size-24" />
        <h1 className="font-turret-road text-center text-3xl text-orange-500">
          Local Session
        </h1>
      </div>

      {localTelegramSession ? (
        <div className="flex flex-col gap-2">
          <Alert variant={"success"}>
            Your Telegram account is currently logged in locally.
          </Alert>

          <button
            className={cn(
              "bg-red-500 text-white",
              "p-2 rounded-lg font-bold",
              "disabled:opacity-50"
            )}
            onClick={handleLogoutButtonClick}
          >
            Logout
          </button>
        </div>
      ) : (
        <TelegramLogin mode="local" storeTelegramSession={handleLoginSuccess} />
      )}
    </div>
  );
}
