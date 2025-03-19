import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useTelegramLogoutMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "telegram", "logout"],
    mutationFn: (data) =>
      cloudBackend.post("/api/telegram/logout", data).then((res) => res.data),
  });
}
