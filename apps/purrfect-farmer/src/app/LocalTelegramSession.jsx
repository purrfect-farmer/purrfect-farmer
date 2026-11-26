import Alert from "@/components/Alert";
import LocalTelegramSessionIcon from "@/assets/images/local-telegram-session.png?format=webp&w=192";
import TelegramLogin from "@/partials/TelegramLogin";
import useAppContext from "@/hooks/useAppContext";
import useLocalTelegramSessionLogout from "@/hooks/useLocalTelegramSessionLogout";
import { cn } from "@/utils";
import { useCallback } from "react";
import Container from "@/components/Container";
import { FARMER_MODE } from "@/constants/farmerMode";

export default function LocalTelegramSession() {
  const { configureSettings, localTelegramSession, setLocalTelegramSession } =
    useAppContext();

  /** The handler for logging out */
  const handleLogoutButtonClick = useLocalTelegramSessionLogout();

  /** Login Success */
  const handleLoginSuccess = useCallback(
    (session) => {
      /** Set Session */
      setLocalTelegramSession(session);

      /** Configure Settings */
      configureSettings("farmerMode", FARMER_MODE.SESSION, false);
    },
    [configureSettings, setLocalTelegramSession]
  );

  return (
    <Container className={cn("flex flex-col justify-center gap-4 p-4 grow")}>
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
    </Container>
  );
}
