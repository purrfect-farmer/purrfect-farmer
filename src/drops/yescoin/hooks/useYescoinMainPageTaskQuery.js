import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinMainPageTaskQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["yescoin", "main-page", "task"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.gold/task/mainPage", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
