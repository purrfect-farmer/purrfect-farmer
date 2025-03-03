import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinOfflineQuery() {
  const api = useFarmerApi();

  return useQuery({
    refetchInterval: 5000,
    queryKey: ["yescoin", "offline"],
    queryFn: ({ signal }) =>
      api
        .post("https://api-backend.yescoin.fun/user/offline", null, {
          signal,
        })
        .then((res) => res.data.data),
  });
}
