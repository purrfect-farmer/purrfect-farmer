import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMajorTasksQuery(daily = false) {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["major", "tasks", daily],
    queryFn: ({ signal }) =>
      api
        .get(`https://major.bot/api/tasks/?is_daily=${daily}`, {
          signal,
        })
        .then((res) => res.data),
  });
}
