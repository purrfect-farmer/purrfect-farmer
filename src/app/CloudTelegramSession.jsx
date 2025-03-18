import Alert from "@/components/Alert";
import CloudTelegramSessionIcon from "@/assets/images/cloud-telegram-session.png?format=webp&w=192";
import TelegramLogin from "@/partials/TelegramLogin";
import useCloudTelegramSession from "@/hooks/useCloudTelegramSession";
import { cn } from "@/lib/utils";

export default function CloudTelegramSession() {
  const [session, setCloudTelegramSession] = useCloudTelegramSession();

  return (
    <div
      className={cn(
        "flex flex-col justify-center min-w-0 min-h-0 gap-4 p-4 grow"
      )}
    >
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={CloudTelegramSessionIcon} className="size-24" />
        <h1 className="font-turret-road text-center text-3xl text-orange-500">
          Cloud Session
        </h1>
      </div>
      {session ? (
        <div className="flex flex-col gap-2">
          <Alert variant={"success"}>
            Your Telegram account is currently logged in on Cloud.
          </Alert>
        </div>
      ) : (
        <TelegramLogin
          mode="cloud"
          storeTelegramSession={setCloudTelegramSession}
        />
      )}
    </div>
  );
}
