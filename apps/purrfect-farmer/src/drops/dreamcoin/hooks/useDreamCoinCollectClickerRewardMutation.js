import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinCollectClickerRewardMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "clicker", "collect-reward"],
    mutationFn: (amount) =>
      api
        .post("https://api.dreamcoin.ai/Clicker/collect-reward", { amount })
        .then((res) => res.data),
  });
}
