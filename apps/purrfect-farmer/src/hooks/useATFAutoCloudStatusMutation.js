import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useATFAutoCloudStatusMutation() {
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["atf-auto", "cloud", "status"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/atf-auto/status", { auth, ...data })
        .then((res) => res.data),
  });
}
