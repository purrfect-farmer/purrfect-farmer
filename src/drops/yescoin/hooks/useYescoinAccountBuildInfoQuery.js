import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinAccountBuildInfoQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["yescoin", "account", "build", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://bi.yescoin.gold/build/getAccountBuildInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
