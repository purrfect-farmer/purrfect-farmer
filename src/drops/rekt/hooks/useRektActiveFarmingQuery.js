import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektActiveFarmingQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["rekt", "farming", "active"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/farming/active", {
          signal,
        })
        .then((res) => res.data),
  });
}
