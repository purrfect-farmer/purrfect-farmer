import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudLogoutMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "logout"],
    mutationFn: () => cloudBackend.post("/api/logout").then((res) => res.data),
  });
}
