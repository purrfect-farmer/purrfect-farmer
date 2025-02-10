import { useMutation } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudLogoutMutation() {
  const { cloudBackend } = useCloudContext();

  return useMutation({
    mutationKey: ["core", "cloud", "logout"],
    mutationFn: () => cloudBackend.post("/api/logout").then((res) => res.data),
  });
}
