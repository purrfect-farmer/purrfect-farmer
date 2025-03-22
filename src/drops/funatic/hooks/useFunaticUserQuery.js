import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryKey: ["funatic", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://api2.funtico.com/api/lucky-funatic/user", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
