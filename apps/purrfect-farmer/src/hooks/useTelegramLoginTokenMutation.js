import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useTelegramLoginTokenMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "telegram", "login-token"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/telegram/login-token", data)
        .then((res) => res.data),
  });
}
