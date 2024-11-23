import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useTomarketFarmingInfoQuery() {
  const { api, tomarket } = useFarmerContext();
  return useQuery({
    queryKey: ["tomarket", "farming-info", tomarket.farm],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api-web.tomarket.ai/tomarket-game/v1/farm/info",
          { game_id: tomarket.farm },
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
