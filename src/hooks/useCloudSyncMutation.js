import AppContext from "@/contexts/AppContext";
import { useContext } from "react";
import { useMutation } from "@tanstack/react-query";

export default function useCloudSyncMutation(id, client) {
  const { cloudBackend } = useContext(AppContext);

  return useMutation(
    {
      mutationKey: ["app", "cloud", "sync", id],
      mutationFn: ({ id, userId, telegramWebApp, headers }) =>
        cloudBackend
          .post("/api/sync", {
            ["farmer"]: id,
            ["user_id"]: userId,
            ["telegram_web_app"]: telegramWebApp,
            ["headers"]: headers,
          })
          .then((res) => res.data),
    },
    client
  );
}
