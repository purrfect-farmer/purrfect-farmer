import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useBattleBullsBuyCardMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["battle-bulls", "card", "buy"],
    mutationFn: (id) =>
      api
        .post("https://api.battle-games.com:8443/api/api/v1/cards/buy", {
          cardId: id,
          requestedAt: Date.now(),
        })
        .then((res) => res.data.data),
  });
}
