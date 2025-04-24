import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMoneyBuxUpdateAdCountMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["money-bux", "update-ad-count"],
    mutationFn: ({ name, hash }) =>
      api
        .post(
          "https://moneybux.xyz/giveaways/update_ad_count",
          new URLSearchParams({
            name,
            hash,
          })
        )
        .then((res) => res.data),
  });
}
