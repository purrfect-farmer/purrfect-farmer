import toast from "react-hot-toast";
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
    async function () {
      if (!accountBuildInfoQuery.data) {
        return;
      }

      const { specialBoxLeftRecoveryCount, coinPoolLeftRecoveryCount } =
        accountBuildInfoQuery.data;

      /** Claim Special Box */
      if (specialBoxLeftRecoveryCount > 0) {
        await recoverSpecialBoxMutation.mutateAsync();
        toast.success("Yescoin - Used Chest");
      }

      /** Claim Special Box */
      if (coinPoolLeftRecoveryCount > 0) {
        await recoverCoinPoolMutation.mutateAsync();
        toast.success("Yescoin - Used Recovery");
      }
    },
    [accountBuildInfoQuery.isLoading === false]
  );
}
