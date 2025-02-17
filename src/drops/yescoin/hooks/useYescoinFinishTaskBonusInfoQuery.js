import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinFinishTaskBonusInfoQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["yescoin", "finish-task", "bonus", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.fun/task/getFinishTaskBonusInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
