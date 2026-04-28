import { getBalances } from "@purrfect/shared/lib/atf-auto";
import useATFAuto from "./useATFAuto";
import { useCallback } from "react";
import { useQueries } from "@tanstack/react-query";

export default function useATFNetWorthQuery() {
  const { accounts, enableRequests } = useATFAuto();
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
        queryKey: ["atf-balances", address],
        queryFn: ({ signal }) => getBalances(address, { signal }),
        refetchInterval: 60_000,
        enabled: enableRequests && Boolean(address),
      };
    }),
  });
}
