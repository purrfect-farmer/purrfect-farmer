import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useATFAutoCloudWithdrawalMutation() {
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["atf-auto", "cloud", "withdraw"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/atf-auto/withdraw", { auth, ...data })
        .then((res) => res.data),
  });
}
