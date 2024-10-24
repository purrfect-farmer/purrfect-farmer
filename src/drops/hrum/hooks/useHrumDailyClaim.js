import toast from "react-hot-toast";
import { useEffect } from "react";

import useHrumDailyClaimMutation from "./useHrumDailyClaimMutation";
import useHrumDailyQuery from "./useHrumDailyQuery";

export default function useHrumDailyClaim() {
  const dailyQuery = useHrumDailyQuery();
  const dailyClaimMutation = useHrumDailyClaimMutation();

  useEffect(() => {
    if (dailyQuery.data) {
      const day = Object.entries(dailyQuery.data).find(
        ([k, v]) => v === "canTake"
      );

      if (day) {
        toast.promise(dailyClaimMutation.mutateAsync(parseInt(day[0])), {
          loading: "Claiming Daily Reward...",
          error: "Failed to claim daily reward...",
          success: "Successfully claimed daily reward.",
        });
      }
    }
  }, [dailyQuery.data]);
}
