import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFrogsterTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["frogster", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://frogster.app/api/tasks", {
          signal,
        })
        .then((res) => res.data),
  });
}
