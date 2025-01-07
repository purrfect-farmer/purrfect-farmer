import AppContext from "@/contexts/AppContext";
import { useContext } from "react";
import { useMutation } from "@tanstack/react-query";

export default function useCloudSyncMutation() {
  const { cloudBackend } = useContext(AppContext);

  return useMutation({
    mutationKey: ["core", "cloud", "sync"],
    mutationFn: ({ id, userId, telegramWebApp, headers }) =>
      cloudBackend
        .post("/api/sync", {
          ["farmer"]: id,
          ["user_id"]: userId,
          ["telegram_web_app"]: telegramWebApp,
          ["headers"]: headers,
        })
        .then((res) => res.data),
  });
}
