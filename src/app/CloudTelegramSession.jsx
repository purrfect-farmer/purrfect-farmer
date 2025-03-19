import Alert from "@/components/Alert";
import CloudTelegramSessionIcon from "@/assets/images/cloud-telegram-session.png?format=webp&w=192";
import TelegramLogin from "@/partials/TelegramLogin";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useTelegramLogoutMutation from "@/hooks/useTelegramLogoutMutation";
import { cn } from "@/lib/utils";

export default function CloudTelegramSession() {
  const { cloudTelegramSession, setCloudTelegramSession } = useAppContext();
  const logoutMutation = useTelegramLogoutMutation();

  const handleLogoutButtonClick = () => {
    toast.promise(
      logoutMutation.mutateAsync(
        { session: cloudTelegramSession },
        {
          onSuccess() {
            setCloudTelegramSession(null);
          },
        }
      ),
      {
        success: "Successfully logged out...",
        error: "Error...",
        loading: "Logging out...",
      }
    );
  };

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
      {cloudTelegramSession ? (
        <div className="flex flex-col gap-2">
          <Alert variant={"success"}>
            Your Telegram account is currently logged in on Cloud.
          </Alert>

          <button
            disabled={logoutMutation.isPending}
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
        <TelegramLogin
          mode="cloud"
          storeTelegramSession={setCloudTelegramSession}
        />
      )}
    </div>
  );
}
