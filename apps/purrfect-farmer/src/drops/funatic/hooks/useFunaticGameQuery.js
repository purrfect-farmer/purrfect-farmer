import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticGameQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["funatic", "game"],
    queryFn: ({ signal }) =>
      api
        .get("https://clicker.api.funtico.com/game", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
