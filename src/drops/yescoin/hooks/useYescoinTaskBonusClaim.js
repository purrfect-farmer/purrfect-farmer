import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";

import useYescoinClaimTaskBonusMutation from "./useYescoinClaimTaskBonusMutation";
import useYescoinFinishTaskBonusInfoQuery from "./useYescoinFinishTaskBonusInfoQuery";

export default function useYescoinTaskBonusClaim() {
  const finishTaskBonusInfoQuery = useYescoinFinishTaskBonusInfoQuery();
  const claimTaskBonusMutation = useYescoinClaimTaskBonusMutation();

  useFarmerAsyncTask(
    "claim-task-bonus",
    () => {
      if (finishTaskBonusInfoQuery.data) {
        const { dailyTaskBonusStatus, commonTaskBonusStatus } =
          finishTaskBonusInfoQuery.data;

        const canClaimDailyTaskBonus = dailyTaskBonusStatus === 1;
        const canClaimCommonTaskBonus = commonTaskBonusStatus === 1;

        if (canClaimDailyTaskBonus || canClaimCommonTaskBonus) {
          return async function () {
            /** Claim Daily Task */
            if (canClaimDailyTaskBonus) {
              await claimTaskBonusMutation.mutateAsync(1);
              toast.success("Yescoin - Claimed Daily Task Bonus");
            }

            /** Claim Common Task */
            if (canClaimCommonTaskBonus) {
              await claimTaskBonusMutation.mutateAsync(2);
              toast.success("Yescoin - Claimed Common Task Bonus");
            }

            /** Refetch */
            await finishTaskBonusInfoQuery.refetch();
          };
        }
      }
    },
    [finishTaskBonusInfoQuery.data]
  );
}
