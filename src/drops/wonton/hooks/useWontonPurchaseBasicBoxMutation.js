import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonPurchaseBasicBoxMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "shop", "purchase-basic-box"],
    mutationFn: (purchaseAmount) =>
      api
        .post("https://wonton.food/api/v1/shop/purchase-basic-box", {
          purchaseAmount,
        })
        .then((res) => res.data),
  });
}
