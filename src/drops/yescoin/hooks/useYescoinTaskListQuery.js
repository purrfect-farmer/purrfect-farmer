import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinTaskListQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["yescoin", "task", "list"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.gold/task/getTaskList", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
