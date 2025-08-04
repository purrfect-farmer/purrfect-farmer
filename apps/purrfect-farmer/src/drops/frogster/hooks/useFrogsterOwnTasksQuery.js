import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFrogsterOwnTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["frogster", "tasks", "own"],
    queryFn: ({ signal }) =>
      api
        .get("https://frogster.app/api/tasks/own", {
          signal,
        })
        .then((res) => res.data),
  });
}
