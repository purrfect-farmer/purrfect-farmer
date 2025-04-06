import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";

import useYescoinClaimTaskBonusMutation from "./useYescoinClaimTaskBonusMutation";
import useYescoinFinishTaskBonusInfoQuery from "./useYescoinFinishTaskBonusInfoQuery";

export default function useYescoinTaskBonusClaim() {
  const finishTaskBonusInfoQuery = useYescoinFinishTaskBonusInfoQuery();
  const claimTaskBonusMutation = useYescoinClaimTaskBonusMutation();

  useFarmerAsyncTask(
    "claim-task-bonus",
    async function () {
      const { dailyTaskBonusStatus, commonTaskBonusStatus } =
        finishTaskBonusInfoQuery.data;

      /** Claim Daily Task */
      if (dailyTaskBonusStatus === 1) {
        await claimTaskBonusMutation.mutateAsync(1);
        toast.success("Yescoin - Claimed Daily Task Bonus");
      }

      /** Claim Common Task */
      if (commonTaskBonusStatus === 1) {
        await claimTaskBonusMutation.mutateAsync(2);
        toast.success("Yescoin - Claimed Common Task Bonus");
      }

      if (dailyTaskBonusStatus === 1 || commonTaskBonusStatus === 1) {
        /** Refetch */
        await finishTaskBonusInfoQuery.refetch();
      }
    },
    [finishTaskBonusInfoQuery.data]
  );
}
