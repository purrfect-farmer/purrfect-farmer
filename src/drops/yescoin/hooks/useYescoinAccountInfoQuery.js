import useFarmerApi from "@/hooks/useFarmerApi";
import { useIsMutating, useQuery } from "@tanstack/react-query";

export default function useYescoinAccountInfoQuery() {
  const api = useFarmerApi();
  const isMutating = useIsMutating({ mutationKey: ["yescoin"] });

  return useQuery({
    refetchInterval: isMutating < 1 ? 5000 : false,
    queryKey: ["yescoin", "account", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.gold/account/getAccountInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
