import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestTasksQuery() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useQuery({
    queryKey: ["matchquest", "tasks", uid],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://tgapp-api.matchain.io/api/tgapp/v1/point/task/list",
          { uid },
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
