import { getBalances } from "@purrfect/shared/lib/auto/wallet";
import useAuto from "./useAuto";
import { useQuery } from "@tanstack/react-query";

export default function useAutoBalancesQuery(address) {
  const { config, master, enableRequests } = useAuto();
  return useQuery({
    queryKey: [config.id, "balances", address],
    queryFn: ({ signal }) =>
      getBalances(config.jettonAddress, address, {
        signal,
        apiKey: master?.tonCenterApiKey,
      }),
    refetchInterval: 60_000,
    enabled: enableRequests && Boolean(address),
  });
}
