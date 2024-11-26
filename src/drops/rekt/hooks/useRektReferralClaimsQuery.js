import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektReferralClaimsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["rekt", "referral", "claims"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/user/referral/claims", {
          signal,
        })
        .then((res) => res.data),
  });
}
