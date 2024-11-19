import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinUserUpgradeTaskListQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["yescoin", "user-upgrade", "task", "list"],
    queryFn: ({ signal }) =>
      api
        .get("https://bi.yescoin.gold/task/getUserUpgradeTaskList", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
