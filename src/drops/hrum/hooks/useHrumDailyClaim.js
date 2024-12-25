import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";

import useHrumDailyClaimMutation from "./useHrumDailyClaimMutation";
import useHrumDailyQuery from "./useHrumDailyQuery";

export default function useHrumDailyClaim() {
  const dailyQuery = useHrumDailyQuery();
  const dailyClaimMutation = useHrumDailyClaimMutation();

  useFarmerAsyncTask(
    "daily.check-in",
    () => {
      if (dailyQuery.data) {
        const day = Object.entries(dailyQuery.data).find(
          ([k, v]) => v === "canTake"
        );

        if (day) {
          return async function () {
            await toast.promise(
              dailyClaimMutation.mutateAsync(parseInt(day[0])),
              {
                loading: "Claiming Daily Reward...",
                error: "Failed to claim daily reward...",
                success: "Successfully claimed daily reward.",
              }
            );

            await dailyQuery.refetch();
          };
        }
      }
    },
    [dailyQuery.data]
  );
}
