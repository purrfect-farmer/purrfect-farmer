import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticDailyBonusQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["funatic", "daily-bonus"],
    queryFn: ({ signal }) =>
      api
        .get("https://api2.funtico.com/api/lucky-funatic/daily-bonus/config", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
