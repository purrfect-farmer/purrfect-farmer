import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMidasReferralStatusQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["midas", "referral", "status"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-tg-app.midas.app/api/referral/status", {
          signal,
        })
        .then((res) => res.data),
  });
}
