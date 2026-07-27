import { getBalances } from "@purrfect/shared/lib/auto/wallet";
import useAuto from "./useAuto";
import { useQuery } from "@tanstack/react-query";

export default function useAutoBalancesQuery(address) {
  const { config, enableRequests } = useAuto();
  return useQuery({
    queryKey: [config.id, "balances", address],
    queryFn: ({ signal }) =>
      getBalances(config.jettonAddress, address, { signal }),
    refetchInterval: 60_000,
    enabled: enableRequests && Boolean(address),
  });
}
