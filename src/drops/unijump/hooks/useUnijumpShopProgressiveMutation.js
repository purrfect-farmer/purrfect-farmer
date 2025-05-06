import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpShopProgressiveMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "shop", "progressive"],
    mutationFn: (offerId) => {
      return api
        .post("https://unijump.xyz/api/v1/shop/purchase/progressive", {
          offerId,
        })
        .then((res) => res.data);
    },
  });
}
