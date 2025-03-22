import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useDiggerTasksQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["digger", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.diggergame.app/api/user-task/list", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
