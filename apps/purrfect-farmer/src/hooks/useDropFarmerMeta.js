import { useCallback } from "react";
import { useMemo } from "react";

import useStaticQuery from "./useStaticQuery";

export default function useDropFarmerMeta({
  id,
  enabled = false,
  instance,
  authData,
  telegramHash,
  queryClient,
  metaQueryOptions = {},
}) {
  /** Meta Query Key */
  const metaQueryKey = useMemo(
    () => [id, "meta", telegramHash],
    [id, telegramHash]
  );

  /** Meta QueryFn */
  const metaQueryFn = useCallback(
    () => instance.fetchMeta(authData),
    [authData, instance]
  );

  /** Meta Query */
  const metaQuery = useStaticQuery(
    {
      ...metaQueryOptions,
      enabled,
      queryKey: metaQueryKey,
      queryFn: metaQueryFn,
    },
    queryClient
  );

  return { metaQueryKey, metaQuery };
}
