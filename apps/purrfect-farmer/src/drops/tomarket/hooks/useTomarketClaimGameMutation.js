import useFarmerApi from "@/hooks/useFarmerApi";
import { extraGamePoints } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketClaimGameMutation(id, points) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tomarket", "game", "claim", id, points],
    mutationFn: (stars) =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/game/claim", {
          game_id: id,
          points: extraGamePoints(points),
          stars,
        })
        .then((res) => res.data.data),
  });
}
