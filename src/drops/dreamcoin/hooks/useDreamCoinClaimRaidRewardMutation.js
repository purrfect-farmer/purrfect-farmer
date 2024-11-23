import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinClaimRaidRewardMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "raid", "claim"],
    mutationFn: (RewardNumber) =>
      api
        .post("https://api.dreamcoin.ai/Raids/claim", { RewardNumber })
        .then((res) => res.data),
  });
}
