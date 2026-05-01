import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useATFAutoCloudCancellationMutation() {
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["atf-auto", "cloud", "cancel"],
    mutationFn: () =>
      cloudBackend
        .post("/api/atf-auto/cancel", { auth })
        .then((res) => res.data),
  });
}
