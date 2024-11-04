import { useCallback } from "react";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function useAppQuery(options) {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => options.queryKey, options.queryKey);
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
