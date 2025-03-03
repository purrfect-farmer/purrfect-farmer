import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektCurrentPriceQuery() {
  const api = useFarmerApi();
  return useQuery({
    refetchInterval: 1000,
    queryKey: ["rekt", "current-price"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/price/current", {
          signal,
        })
        .then((res) => res.data),
  });
}
