import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumClaimGameMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "game", "claim"],
    mutationFn: (payload) =>
      api
        .post("https://game-domain.blum.codes/api/v2/game/claim", {
          payload,
        })
        .then((res) => res.data),
  });
}
