import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";

import useYescoinAccountBuildInfoQuery from "./useYescoinAccountBuildInfoQuery";
import useYescoinRecoverCoinPoolMutation from "./useYescoinRecoverCoinPoolMutation";
import useYescoinRecoverSpecialBoxMutation from "./useYescoinRecoverSpecialBoxMutation";

export default function useYescoinSpecialBoxClaim() {
  const accountBuildInfoQuery = useYescoinAccountBuildInfoQuery();
  const recoverSpecialBoxMutation = useYescoinRecoverSpecialBoxMutation();
  const recoverCoinPoolMutation = useYescoinRecoverCoinPoolMutation();

  useFarmerAsyncTask(
    "claim-special-box",
    () => {
      if (
        accountBuildInfoQuery.isLoading === false &&
        accountBuildInfoQuery.data
      )
        return async function () {
          const { specialBoxLeftRecoveryCount, coinPoolLeftRecoveryCount } =
            accountBuildInfoQuery.data;

          /** Claim Special Box */
          if (specialBoxLeftRecoveryCount > 0) {
            await recoverSpecialBoxMutation.mutateAsync();
          }

          /** Claim Special Box */
          if (coinPoolLeftRecoveryCount > 0) {
            await recoverCoinPoolMutation.mutateAsync();
          }
        };
    },
    [accountBuildInfoQuery.isLoading]
  );
}
