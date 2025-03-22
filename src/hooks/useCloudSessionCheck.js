import toast from "react-hot-toast";
import { useEffect } from "react";

import useAppContext from "./useAppContext";
import useTelegramCheckMutation from "./useTelegramCheckMutation";

export default function useCloudSessionCheck() {
  const { cloudTelegramSession, setCloudTelegramSession } = useAppContext();
  const telegramCheckMutation = useTelegramCheckMutation();

  useEffect(() => {
    if (cloudTelegramSession) {
      telegramCheckMutation
        .mutateAsync(cloudTelegramSession)
        .then(({ status }) => {
          if (status === false) {
            /** Remove Session */
            setCloudTelegramSession(null);

            /** Toast */
            toast.error("Telegram Account has been logged out of Cloud!");
          }
        });
    }
  }, [cloudTelegramSession]);
}
