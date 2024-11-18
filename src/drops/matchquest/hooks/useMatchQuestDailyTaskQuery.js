import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMatchQuestDailyTaskQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["matchquest", "daily-task"],
    queryFn: ({ signal }) =>
      api
        .get("https://tgapp-api.matchain.io/api/tgapp/v1/daily/task/status", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
