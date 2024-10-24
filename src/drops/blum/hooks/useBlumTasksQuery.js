import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useBlumTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["blum", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://earn-domain.blum.codes/api/v1/tasks", {
          signal,
        })
        .then((res) => res.data),
  });
}
