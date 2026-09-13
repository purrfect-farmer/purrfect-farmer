import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useTelegramLoginTokenConfirmMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "telegram", "login-token", "confirm"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/telegram/login-token/confirm", data)
        .then((res) => res.data),
  });
}
