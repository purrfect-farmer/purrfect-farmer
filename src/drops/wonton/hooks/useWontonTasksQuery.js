import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useWontonTasksQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["wonton", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://wonton.food/api/v1/task/list", {
          signal,
        })
        .then((res) => res.data),
  });
}
