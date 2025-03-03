import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinAccountInfoQuery() {
  const api = useFarmerApi();

  return useQuery({
    refetchInterval: 5000,
    queryKey: ["yescoin", "account", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.fun/account/getAccountInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
