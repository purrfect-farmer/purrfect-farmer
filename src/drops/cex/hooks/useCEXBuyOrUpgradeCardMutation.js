import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useCEXBuyOrUpgradeCardMutation() {
  const { api, payload } = useFarmerContext();
  return useMutation({
    mutationKey: ["cex", "card", "buy-or-upgrade"],
    mutationFn: (data) =>
      api
        .post("https://app.cexptap.com/api/v2/buyUpgrade", {
          ...payload,
          data,
        })
        .then((res) => res.data),
  });
}
