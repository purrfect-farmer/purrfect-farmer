import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektReferralCodeQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["rekt", "referral-code"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/user/referral", {
          signal,
        })
        .then((res) => res.data),
  });
}
