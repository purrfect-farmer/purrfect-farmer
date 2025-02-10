import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinQuestQuery(category) {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["yescoin", "quest", "list", category],
    queryFn: ({ signal }) =>
      api
        .get(`https://bi.yescoin.gold/quest/list?category=${category}`, {
          signal,
        })
        .then((res) => res.data.data),
  });
}
