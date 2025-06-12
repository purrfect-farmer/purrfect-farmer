import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useNeubeatDailyTaskQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["neubeat", "daily-task"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.audiera.fi/api/dailyTask", {
          signal,
        })
        .then((res) => res.data),
  });
}
