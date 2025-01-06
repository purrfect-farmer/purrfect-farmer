import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticBoostersQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["funatic", "boosters"],
    queryFn: ({ signal }) =>
      api
        .get("https://clicker.api.funtico.com/boosters", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
