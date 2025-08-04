import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektClaimReferralTradeMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "referral", "trade", "claim"],
    mutationFn: () =>
      api
        .post("https://rekt-mini-app.vercel.app/api/user/referral/trade/claim")
        .then((res) => res.data),
  });
}
