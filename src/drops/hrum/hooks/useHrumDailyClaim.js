import toast from "react-hot-toast";
import useFarmerContext from "@/hooks/useFarmerContext";
import { useEffect } from "react";

import useHrumDailyClaimMutation from "./useHrumDailyClaimMutation";

export default function useHrumDailyClaim() {
  const { dailyQuestsRequest } = useFarmerContext();
  const dailyClaimMutation = useHrumDailyClaimMutation();
  const dailyQuests = dailyQuestsRequest.data?.data;

  useEffect(() => {
    if (dailyQuests) {
      const day = Object.entries(dailyQuests).find(([k, v]) => v === "canTake");

      if (day) {
        toast.promise(dailyClaimMutation.mutateAsync(parseInt(day[0])), {
          loading: "Claiming Daily Reward...",
          error: "Failed to claim daily reward...",
          success: "Successfully claimed daily reward.",
        });
      }
    }
  }, [dailyQuests]);
}
