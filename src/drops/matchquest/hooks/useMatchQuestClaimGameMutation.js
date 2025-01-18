import useFarmerApi from "@/hooks/useFarmerApi";
import { extraGamePoints } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export default function useMatchQuestClaimGameMutation(points) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["matchquest", "game", "claim", points],
    mutationFn: (id) =>
      api
        .post("https://tgapp-api.matchain.io/api/tgapp/v1/game/claim", {
          ["game_id"]: id,
          ["point"]: extraGamePoints(points),
        })
        .then((res) => res.data.data),
  });
}
