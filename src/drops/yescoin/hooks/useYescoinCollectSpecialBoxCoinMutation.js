import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinCollectSpecialBoxCoinMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "special-box", "collect"],
    mutationFn: ({ boxType, coinCount }) =>
      api
        .post(
          "https://api-backend.yescoin.gold/game/collectSpecialBoxCoin",
          { boxType, coinCount },
          {
            headers: { "content-type": "application/json" },
          }
        )
        .then((res) => res.data.data),
  });
}
