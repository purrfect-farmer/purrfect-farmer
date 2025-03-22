import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useTelegramCheckMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "telegram", "check"],
    mutationFn: (session) =>
      cloudBackend
        .post("/api/telegram/check", { session })
        .then((res) => res.data),
  });
}
