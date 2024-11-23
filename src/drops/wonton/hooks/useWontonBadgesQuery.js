import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useWontonBadgesQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["wonton", "badges"],
    queryFn: ({ signal }) =>
      api
        .get("https://wonton.food/api/v1/badge/list", {
          signal,
        })
        .then((res) => res.data),
  });
}
