import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerEnvRevealMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "env", "reveal"],
    mutationFn: (key) =>
      cloudBackend
        .post("/api/manager/env/reveal", { key })
        .then((res) => res.data.value),
  });
}
