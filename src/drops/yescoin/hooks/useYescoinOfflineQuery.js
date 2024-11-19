import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinOfflineQuery() {
  const api = useFarmerApi();

  return useQuery({
    meta: {
      defaultRefetchInterval: 5000,
    },
    queryKey: ["yescoin", "offline"],
    queryFn: ({ signal }) =>
      api
        .post("https://bi.yescoin.gold/user/offline", null, {
          signal,
        })
        .then((res) => res.data.data),
  });
}
