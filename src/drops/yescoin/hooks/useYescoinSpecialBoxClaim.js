import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { useState } from "react";

import useYescoinAccountBuildInfoQuery from "./useYescoinAccountBuildInfoQuery";
import useYescoinRecoverCoinPoolMutation from "./useYescoinRecoverCoinPoolMutation";
import useYescoinRecoverSpecialBoxMutation from "./useYescoinRecoverSpecialBoxMutation";

export default function useYescoinSpecialBoxClaim() {
  const accountBuildInfoQuery = useYescoinAccountBuildInfoQuery();
  const recoverSpecialBoxMutation = useYescoinRecoverSpecialBoxMutation();
  const recoverCoinPoolMutation = useYescoinRecoverCoinPoolMutation();
  const [hasUsedSpecialBox, setHasUsedSpecialBox] = useState(false);

  useFarmerAsyncTask(
    "claim-special-box",
    () => {
      if (hasUsedSpecialBox) return;
      if (accountBuildInfoQuery.data) {
        const { specialBoxLeftRecoveryCount, coinPoolLeftRecoveryCount } =
          accountBuildInfoQuery.data;

        const shouldClaimSpecialBox = specialBoxLeftRecoveryCount > 0;
        const shouldClaimCoinPool = coinPoolLeftRecoveryCount > 0;

        if (shouldClaimSpecialBox || shouldClaimCoinPool) {
          return async function () {
            /** Claim Special Box */
            if (shouldClaimSpecialBox) {
              await recoverSpecialBoxMutation.mutateAsync();
              toast.success("Yescoin - Used Chest");
            }

            /** Claim Special Box */
            if (shouldClaimCoinPool) {
              await recoverCoinPoolMutation.mutateAsync();
              toast.success("Yescoin - Used Recovery");
            }
            /** Refetch */
            await accountBuildInfoQuery.refetch();

            /** Mark as Used */
            setHasUsedSpecialBox(true);
          };
        }
      }
    },
    [accountBuildInfoQuery.data, hasUsedSpecialBox]
  );
}
