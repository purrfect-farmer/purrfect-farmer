import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMidasClaimReferralRewardsMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["midas", "referral", "rewards", "claim"],
    mutationFn: () =>
      api
        .post("https://api-tg-app.midas.app/api/referral/claim", null)
        .then((res) => res.data),
  });
}
