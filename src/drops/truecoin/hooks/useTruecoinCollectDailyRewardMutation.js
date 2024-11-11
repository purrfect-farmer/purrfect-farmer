import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTruecoinCollectDailyRewardMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["truecoin", "daily", "collect-reward"],
    mutationFn: () =>
      api
        .get("https://api.true.world/api/dailyReward/collectReward")
        .then((res) => res.data),
  });
}
