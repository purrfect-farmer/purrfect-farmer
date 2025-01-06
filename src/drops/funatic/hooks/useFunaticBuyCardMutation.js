import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticBuyCardMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "card", "buy"],
    mutationFn: (cardId) =>
      api
        .post("https://api2.funtico.com/api/lucky-funatic/buy-card", {
          cardId,
        })
        .then((res) => res.data.data),
  });
}
