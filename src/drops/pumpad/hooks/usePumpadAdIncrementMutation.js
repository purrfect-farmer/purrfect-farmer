import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function usePumpadAdIncrementMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["pumpad", "ad", "increment"],
    mutationFn: () =>
      api
        .post("https://tg.pumpad.io/referral/api/v1/ads/increment", {
          ["ad_source"]: "ADSGRAM",
          ["page_type"]: "GET_RAFFLE_TICKETS",
          ["ad_event"]: "VIDEO_AD_BEGIN",
        })
        .then((res) => res.data),
  });
}
