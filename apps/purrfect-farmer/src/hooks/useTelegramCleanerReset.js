import resetTelegramAccount from "@purrfect/shared/lib/account/resetTelegramAccount.js";
import toast from "react-hot-toast";
import { getTwoFaErrorMessage } from "@purrfect/shared/utils/telegram.js";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useMirroredCallback from "./useMirroredCallback";

/** A hook for resetting the local session's account, each mirror resetting its own */
export default function useTelegramCleanerReset({ onReset }) {
  const { telegramClient } = useAppContext();
  const ref = telegramClient.ref;
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState(null);

  /** Run the reset with the submitted options */
  const [, dispatchAndReset] = useMirroredCallback(
    "telegram-cleaner.reset",
    async (options) => {
      setIsPending(true);

      try {
        const { removed, failed } = await toast.promise(
          resetTelegramAccount(ref.current, options, setProgress),
          {
            loading: "Resetting account...",
            success: ({ removed, failed }) =>
              `Account reset! Removed ${removed}, failed ${failed}`,
            error: (error) => `Reset failed: ${getTwoFaErrorMessage(error)}`,
          },
        );

        /** Report the result */
        onReset({ removed, failed });
      } catch (error) {
        console.error("Failed to reset account:", error);
      } finally {
        setIsPending(false);
        setProgress(null);
      }
    },
    [ref, onReset],
  );

  return { isPending, progress, reset: dispatchAndReset };
}
