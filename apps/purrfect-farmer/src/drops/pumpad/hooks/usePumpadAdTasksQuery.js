import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadAdTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["pumpad", "ad", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/tg/member/ad_task", {
          signal,
        })
        .then((res) => res.data),
  });
}
