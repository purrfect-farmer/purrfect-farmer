import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadPointTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["pumpad", "point", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/tg/member/points_task", {
          signal,
        })
        .then((res) => res.data),
  });
}
