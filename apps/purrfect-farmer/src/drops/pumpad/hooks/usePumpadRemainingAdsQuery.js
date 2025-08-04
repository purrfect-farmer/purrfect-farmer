import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadRemainingAdsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["pumpad", "ads", "remaining"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/ads/remainingviews", {
          signal,
        })
        .then((res) => res.data),
  });
}
