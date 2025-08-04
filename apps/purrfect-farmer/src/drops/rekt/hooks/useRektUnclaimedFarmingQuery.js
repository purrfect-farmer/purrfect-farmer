import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektUnclaimedFarmingQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["rekt", "farming", "unclaimed"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/farming/unclaimed", {
          signal,
        })
        .then((res) => res.data),
  });
}
