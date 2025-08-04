import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketStartGameMutation(id) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tomarket", "game", "start", id],
    mutationFn: () =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/game/play", {
          game_id: id,
        })
        .then((res) => res.data.data),
  });
}
