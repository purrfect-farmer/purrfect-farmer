import { useMutation, useQueryClient } from "@tanstack/react-query";

import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";

/** Collects from a single account in the Cloud, resolving with the booster's result */
export default function useAutoCloudSingleCollectMutation() {
  const { config, password, master } = useAuto();
  const { auth, cloudBackend } = useCloudQueryOptions();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [config.id, "cloud", "single-collect"],
    onSuccess: (_data, { account }) => {
      queryClient.invalidateQueries({
        queryKey: [config.id, "balances", account.address],
      });
      queryClient.invalidateQueries({
        queryKey: [config.id, "balances", master.address],
      });
    },
    onError: (error) => {
      console.log("Error while collecting account in Cloud", error);
    },
    mutationFn: ({ account }) =>
      cloudBackend
        .post(`/api/auto/${config.id}/single-collect`, {
          auth,
          password,
          master,
          accounts: [account],
        })
        .then((res) => res.data),
  });
}
