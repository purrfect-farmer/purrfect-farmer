import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMajorUserStreakQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["major", "user-visits", "streak"],
    queryFn: ({ signal }) =>
      api
        .get("https://major.bot/api/user-visits/streak/", {
          signal,
        })
        .then((res) => res.data),
  });
}
