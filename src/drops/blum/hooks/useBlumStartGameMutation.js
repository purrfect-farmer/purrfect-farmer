import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumStartGameMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "game", "start"],
    mutationFn: () =>
      api
        .post("https://game-domain.blum.codes/api/v2/game/play", null)
        .then((res) => res.data),
  });
}
