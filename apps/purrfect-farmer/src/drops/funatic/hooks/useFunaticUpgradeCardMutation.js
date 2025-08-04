import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticUpgradeCardMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "card", "upgrade"],
    mutationFn: (cardId) =>
      api
        .post("https://api2.funtico.com/api/lucky-funatic/upgrade-card", {
          cardId,
        })
        .then((res) => res.data.data),
  });
}
