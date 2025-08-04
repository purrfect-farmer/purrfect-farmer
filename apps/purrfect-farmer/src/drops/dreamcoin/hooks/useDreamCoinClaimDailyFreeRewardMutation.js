import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinClaimDailyFreeRewardMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "free-reward", "claim-daily"],
    mutationFn: (id) =>
      api
        .post(`https://api.dreamcoin.ai/FreeReward/claimDaily/${id}`, {})
        .then((res) => res.data),
  });
}
