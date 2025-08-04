import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketClaimFarmingMutation() {
  const { api, tomarket } = useFarmerContext();
  return useMutation({
    mutationKey: ["tomarket", "farming", "claim", tomarket.farm],
    mutationFn: () =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/farm/claim", {
          game_id: tomarket.farm,
        })
        .then((res) => res.data.data),
  });
}
