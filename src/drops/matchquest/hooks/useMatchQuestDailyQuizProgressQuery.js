import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMatchQuestDailyQuizProgressQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["matchquest", "daily-quiz", "progress"],
    queryFn: ({ signal }) =>
      api
        .get("https://tgapp-api.matchain.io/api/tgapp/v1/daily/quiz/progress", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
