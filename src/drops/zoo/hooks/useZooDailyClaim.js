import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { useQueryClient } from "@tanstack/react-query";

import useZooDailyClaimMutation from "./useZooDailyClaimMutation";
import useZooDataQueries from "./useZooDataQueries";

export default function useZooDailyClaim() {
  const dataQueries = useZooDataQueries();
  const dailyClaimMutation = useZooDailyClaimMutation();
  const [, afterData] = dataQueries.data;
  const queryClient = useQueryClient();

  useFarmerAsyncTask(
    "daily-reward",
    () => {
      if (afterData) {
        const dailyRewards = afterData.dailyRewards;
        const day = Object.entries(dailyRewards).find(
          ([k, v]) => v === "canTake"
        );

        if (day) {
          return async function () {
            await toast
              .promise(dailyClaimMutation.mutateAsync(parseInt(day[0])), {
                loading: "Claiming Daily Reward...",
                error: "Failed to claim daily reward...",
                success: "Successfully claimed daily reward.",
              })
              .then((result) => {
                /** Update All Data */
                queryClient.setQueryData(["zoo", "all"], (prev) => {
                  return {
                    ...prev,
                    hero: result.hero,
                  };
                });

                /** Update After Data */
                queryClient.setQueryData(["zoo", "after"], (prev) => {
                  return {
                    ...prev,
                    dailyRewards: result.dailyRewards,
                  };
                });
              });
          };
        }
      }
    },
    [afterData]
  );
}
