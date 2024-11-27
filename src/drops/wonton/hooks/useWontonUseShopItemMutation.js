import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonUseShopItemMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "shop", "use-item"],
    mutationFn: (id) =>
      api
        .post("https://wonton.food/api/v1/shop/use-item", { itemId: id })
        .then((res) => res.data),
  });
}
