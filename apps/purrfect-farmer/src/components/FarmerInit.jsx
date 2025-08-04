import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/lib/utils";
import { memo } from "react";

import Alert from "./Alert";

export default memo(function FarmerInit({
  mode,
  status,
  title,
  icon,
  className,
}) {
  const { farmerMode } = useAppContext();
  const invalidMode = typeof mode !== "undefined" && mode !== farmerMode;

  return (
    <div className="flex flex-col items-center justify-center min-w-0 min-h-0 gap-2 p-4 grow">
      <img src={icon} alt={title} className="w-16 h-16 my-2 rounded-full" />
      {invalidMode ? (
        <Alert variant={"danger"}>
          Your current farmer mode is incompatible with this farmer. This farmer
          requires: <span className="uppercase font-bold">{mode}</span> mode.
        </Alert>
      ) : (
        <>
          <h3 className="font-bold text-center">
            {status === "pending-webapp" ? (
              <>Getting Web App</>
            ) : (
              <>Preparing Farmer</>
            )}
          </h3>
          <p className={cn("text-center text-neutral-400", className)}>
            {mode === "session" ? (
              <>Sending /start Message</>
            ) : farmerMode === "session" ? (
              <>Please wait...</>
            ) : status === "pending-webapp" ? (
              <>Please open/reload the bot</>
            ) : (
              <>If stuck for too long, you should reload the bot</>
            )}
          </p>
        </>
      )}
    </div>
  );
});
