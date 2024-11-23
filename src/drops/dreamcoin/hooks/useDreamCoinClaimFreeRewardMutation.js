import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinClaimFreeRewardMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "free-reward", "claim"],
    mutationFn: (id) =>
      api
        .post(`https://api.dreamcoin.ai/FreeReward/claim/${id}`, {})
        .then((res) => res.data),
  });
}
