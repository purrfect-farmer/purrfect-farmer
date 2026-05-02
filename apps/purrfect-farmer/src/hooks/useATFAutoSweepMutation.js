import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useATFAutoSweepMutation() {
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["atf-auto", "sweep"],
    mutationFn: async () => {
      const activeIds = await cloudBackend
        .post("/api/atf-auto/get-active-list", { auth })
        .then((res) => res.data);
    },
  });
}
