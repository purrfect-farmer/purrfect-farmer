import { useMutation, useQueryClient } from "@tanstack/react-query";

import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";

/** Boosts a single account in the Cloud, resolving with the booster's result */
export default function useAutoCloudSingleBoostMutation() {
  const { config, password, master } = useAuto();
  const { auth, cloudBackend } = useCloudQueryOptions();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [config.id, "cloud", "single-boost"],
    onSuccess: (_data, { account }) => {
      queryClient.invalidateQueries({
        queryKey: [config.id, "balances", account.address],
      });
      queryClient.invalidateQueries({
        queryKey: [config.id, "balances", master.address],
      });
    },
    onError: (error) => {
      console.log("Error while boosting account in Cloud", error);
    },
    mutationFn: ({ account, difference, amount, reuseLastAmount }) =>
      cloudBackend
        .post(`/api/auto/${config.id}/single-boost`, {
          auth,
          password,
          master,
          accounts: [account],
          difference,
          amount,
          reuseLastAmount,
        })
        .then((res) => res.data),
  });
}
