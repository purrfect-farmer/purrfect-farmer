import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useWontonFarmingStatusQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["wonton", "farming", "status"],
    queryFn: ({ signal }) =>
      api
        .get("https://wonton.food/api/v1/user/farming-status", {
          signal,
        })
        .then((res) => res.data),
  });
}
