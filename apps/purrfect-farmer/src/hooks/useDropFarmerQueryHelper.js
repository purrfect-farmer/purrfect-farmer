import { useCallback } from "react";

export default function useDropFarmerQueryHelper({
  id,
  queryClient,
  authQuery,
  metaQuery,
}) {
  /** Update Query Data */
  const updateQueryData = useCallback(
    (...args) => queryClient.setQueryData(...args),
    [queryClient.setQueryData]
  );

  /** Update Auth Query Data */
  const updateAuthQueryData = useCallback(
    (...args) => authQuery.updateQueryData(...args),
    [authQuery.updateQueryData]
  );

  /** Update Meta Query Data */
  const updateMetaQueryData = useCallback(
    (...args) => metaQuery.updateQueryData(...args),
    [metaQuery.updateQueryData]
  );

  /** Remove Queries */
  const removeQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: [id] });
  }, [id, queryClient.removeQueries]);

  /** Reset Queries */
  const resetQueries = useCallback(() => {
    queryClient.resetQueries({ queryKey: [id] });
  }, [id, queryClient.resetQueries]);

  return {
    updateQueryData,
    updateAuthQueryData,
    updateMetaQueryData,
    removeQueries,
    resetQueries,
  };
}
