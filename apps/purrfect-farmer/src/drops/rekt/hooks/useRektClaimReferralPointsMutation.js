import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektClaimReferralPointsMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "referral", "points", "claim"],
    mutationFn: () =>
      api
        .post("https://rekt-mini-app.vercel.app/api/user/referral/points/claim")
        .then((res) => res.data),
  });
}
