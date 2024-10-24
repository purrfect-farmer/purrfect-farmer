import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketClaimGameMutation(id, points) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tomarket", "game", "claim", id, points],
    mutationFn: () =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/game/claim", {
          game_id: id,
          points: points + Math.floor(Math.random() * 20),
        })
        .then((res) => res.data.data),
  });
}
