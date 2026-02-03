import { HiBolt, HiBoltSlash, HiOutlineCloud } from "react-icons/hi2";

import { cn } from "@/utils";
import useAppContext from "@/hooks/useAppContext";
import useCloudServerQuery from "@/hooks/useCloudServerQuery";

export default function CloudStatus(props) {
  const { telegramUser, settings, cloudTelegramSession } = useAppContext();
  const initData = telegramUser?.initData;
  const { status, data } = useCloudServerQuery();

  return settings.enableCloud ? (
    <p
      className={cn(
        "text-center flex items-center justify-center gap-2",
        props.className,
        {
          pending: "text-orange-500",
          success: "text-green-600 dark:text-green-500",
          error: "text-red-500",
        }[status],
      )}
    >
      <HiOutlineCloud className="w-4 h-4" /> Cloud:{" "}
      {status === "success" ? (
        <>
          {data.name}{" "}
          {initData ? (
            <span
              title={
                cloudTelegramSession
                  ? `Session: ${cloudTelegramSession}`
                  : "No active session"
              }
              className={cn(!cloudTelegramSession && "text-orange-500")}
            >
              (
              {cloudTelegramSession ? (
                <HiBolt className="w-4 h-4 inline-flex" />
              ) : (
                <HiBoltSlash className="w-4 h-4 inline-flex" />
              )}
              )
            </span>
          ) : null}
        </>
      ) : status === "pending" ? (
        "Checking"
      ) : (
        "Error"
      )}
    </p>
  ) : null;
}
