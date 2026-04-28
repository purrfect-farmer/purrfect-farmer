import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useATFAutoCloudBoostMutation() {
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["atf-auto", "cloud", "boost"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/atf-auto/boost", { auth, ...data })
        .then((res) => res.data),
  });
}
