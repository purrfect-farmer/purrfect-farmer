import { useCallback } from "react";
import { useDeepCompareMemo } from "use-deep-compare";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * App Query
 * @param {import("@tanstack/react-query").UseQueryOptions} options
 * @param {import("@tanstack/react-query").QueryClient | null} client
 */
export default function useAppQuery(options, client) {
  const contextClient = useQueryClient();
  const queryClient = client || contextClient;

  const queryKey = useDeepCompareMemo(
    () => options.queryKey,
    [options.queryKey]
  );
  const query = useQuery(options);

  const updateQueryData = useCallback(
    (...args) => queryClient.setQueryData(queryKey, ...args),
    [queryClient.setQueryData, queryKey]
  );

  return useMemo(
    () => ({
      ...query,
      queryKey,
      queryClient,
      updateQueryData,
    }),
    [query, queryClient, queryKey, updateQueryData]
  );
}
