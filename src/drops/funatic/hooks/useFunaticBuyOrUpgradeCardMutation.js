import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticBuyOrUpgradeCardMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "card", "buy-or-upgrade"],
    mutationFn: ({ cardId, isUpgrade = false }) =>
      api
        .post(
          `https://api2.funtico.com/api/lucky-funatic/${
            isUpgrade ? "upgrade-card" : "buy-card"
          }`,
          {
            cardId,
          }
        )
        .then((res) => res.data.data),
  });
}
