import { getBalances } from "@purrfect/shared/lib/auto/wallet";
import useAuto from "./useAuto";
import { useCallback } from "react";
import { useQueries } from "@tanstack/react-query";

export default function useAutoNetWorthQuery() {
  const { config, accounts, enableRequests } = useAuto();
  const combine = useCallback((results) => {
    return {
      query: results,
      data: results.map((result) => result.data),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      isSuccess: results.every((result) => result.isSuccess),
    };
  }, []);

  return useQueries({
    combine,
    queries: accounts.map((item) => {
      const address = item.address;
      return {
        queryKey: [config.id, "balances", address],
        queryFn: ({ signal }) =>
          getBalances(config.jettonAddress, address, { signal }),
        refetchInterval: 60_000,
        enabled: enableRequests && Boolean(address),
      };
    }),
  });
}
