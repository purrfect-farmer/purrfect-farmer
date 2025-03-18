import Alert from "@/components/Alert";
import LocalTelegramSessionIcon from "@/assets/images/local-telegram-session.png?format=webp&w=192";
import TelegramLogin from "@/partials/TelegramLogin";
import useLocalTelegramSession from "@/hooks/useLocalTelegramSession";
import { cn } from "@/lib/utils";

export default function LocalTelegramSession() {
  const [session, setCloudTelegramSession] = useLocalTelegramSession();

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

      {session ? (
        <div className="flex flex-col gap-2">
          <Alert variant={"success"}>
            Your Telegram account is currently logged in locally.
          </Alert>
        </div>
      ) : (
        <TelegramLogin
          mode="local"
          storeTelegramSession={setCloudTelegramSession}
        />
      )}
    </div>
  );
}
