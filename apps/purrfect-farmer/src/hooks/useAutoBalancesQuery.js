import { getBalances } from "@purrfect/shared/lib/auto/wallet";
import useAuto from "./useAuto";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

/** The options for one address, shared so a list can read the same cache entries */
export function useAutoBalancesQueryOptions() {
  const { config, master, enableRequests } = useAuto();

  return useCallback(
    (address) => ({
      queryKey: [config.id, "balances", address],
      queryFn: ({ signal }) =>
        getBalances(config.jettonAddress, address, {
          signal,
          apiKey: master?.tonCenterApiKey,
        }),
      refetchInterval: 60_000,
      enabled: enableRequests && Boolean(address),
    }),
    [config.id, config.jettonAddress, master?.tonCenterApiKey, enableRequests],
  );
}

export default function useAutoBalancesQuery(address) {
  const options = useAutoBalancesQueryOptions();
  return useQuery(options(address));
}
