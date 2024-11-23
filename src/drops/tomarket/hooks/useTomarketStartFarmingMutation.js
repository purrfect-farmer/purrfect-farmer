import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketStartFarmingMutation() {
  const { api, tomarket } = useFarmerContext();
  return useMutation({
    mutationKey: ["tomarket", "farming", "start", tomarket.farm],
    mutationFn: () =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/farm/start", {
          game_id: tomarket.farm,
        })
        .then((res) => res.data.data),
  });
}
