import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useATFAutoCloudCollectionMutation() {
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["atf-auto", "cloud", "collect"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/atf-auto/collect", { auth, ...data })
        .then((res) => res.data),
  });
}
