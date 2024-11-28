import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";

import useYescoinClaimTaskBonusMutation from "./useYescoinClaimTaskBonusMutation";

export default function useYescoinTaskBonusClaim() {
  const finishTaskBonusInfoQuery = useYescoinFinishTaskBonusInfoQuery();
  const claimTaskBonusMutation = useYescoinClaimTaskBonusMutation();

  useFarmerAsyncTask(
    "claim-task-bonus",
    () => {
      if (finishTaskBonusInfoQuery.data)
        return async function () {
          const { dailyTaskBonusStatus, commonTaskBonusStatus } =
            finishTaskBonusInfoQuery.data;

          /** Claim Common Task */
          if (commonTaskBonusStatus === 1) {
            await claimTaskBonusMutation.mutateAsync(2);
          }

          /** Claim Daily Task */
          if (dailyTaskBonusStatus === 1) {
            await claimTaskBonusMutation.mutateAsync(1);
          }

          if (dailyTaskBonusStatus === 1 || commonTaskBonusStatus === 1) {
            /** Refetch */
            await finishTaskBonusInfoQuery.refetch();
          }
        };
    },
    [finishTaskBonusInfoQuery.data]
  );
}
