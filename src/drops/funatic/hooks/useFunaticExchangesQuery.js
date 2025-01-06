import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticExchangesQuery() {
  const api = useFarmerApi();
  return useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryKey: ["funatic", "exchanges"],
    queryFn: ({ signal }) =>
      api
        .get("https://api2.funtico.com/api/lucky-funatic/exchanges", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
