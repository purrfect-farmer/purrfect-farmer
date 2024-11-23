import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useDreamCoinDailyTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["dreamcoin", "daily-tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.dreamcoin.ai/DailyTasks/current", {
          signal,
        })
        .then((res) => res.data),
  });
}
