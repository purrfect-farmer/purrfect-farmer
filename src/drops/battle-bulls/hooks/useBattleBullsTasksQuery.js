import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useBattleBullsTasksQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["battle-bulls", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.battle-games.com:8443/api/api/v1/tasks", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
