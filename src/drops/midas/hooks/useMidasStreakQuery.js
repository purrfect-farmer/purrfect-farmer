import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMidasStreakQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["midas", "streak"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-tg-app.midas.app/api/streak", {
          signal,
        })
        .then((res) => res.data),
  });
}
