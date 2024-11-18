import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMatchQuestStartGameMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["matchquest", "game", "start"],
    mutationFn: () =>
      api
        .get("https://tgapp-api.matchain.io/api/tgapp/v1/game/play")
        .then((res) => res.data.data),
  });
}
