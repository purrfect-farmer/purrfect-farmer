import {
  getChromeLocalStorage,
  removeChromeLocalStorage,
  setChromeLocalStorage,
} from "@/lib/utils";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

import useChromeStorageKey from "./useChromeStorageKey";
import useStaticQuery from "./useStaticQuery";

export default function useDropFarmerAuth({
  id,
  enabled = true,
  instance,
  queryClient,
  telegramHash,
  cacheAuth = true,
  authQueryOptions = {},
  setHasConfiguredAuthHeaders,
}) {
  /** Auth Chrome Storage Key */
  const authChromeStorageKey = useChromeStorageKey(`farmer-auth:${id}`);

  /** Auth Query Key */
  const authQueryKey = useMemo(
    () => [id, "auth", telegramHash],
    [id, telegramHash]
  );

  /** Auth QueryFn */
  const authQueryFn = useCallback(
    () =>
      cacheAuth
        ? getChromeLocalStorage(authChromeStorageKey, null).then(
            (result) => result || instance.fetchAuth()
          )
        : instance.fetchAuth(),
    [
      /** Deps */
      instance,
      cacheAuth,
      authChromeStorageKey,
    ]
  );

  /** Auth Query */
  const authQuery = useStaticQuery(
    {
      ...authQueryOptions,
      enabled,
      queryKey: authQueryKey,
      queryFn: authQueryFn,
    },
    queryClient
  );

  /** Reset Auth Cache */
  const resetAuthCache = useCallback(
    () => removeChromeLocalStorage(authChromeStorageKey),
    [authChromeStorageKey]
  );

  /** Handle Auth Data  */
  useLayoutEffect(() => {
    if (authQuery.isSuccess) {
      /** Configure Auth Headers */
      const cleanup = instance.configureAuthHeaders?.(authQuery.data);

      /** Set as configured */
      setHasConfiguredAuthHeaders(true);

      return cleanup;
    }
  }, [
    instance,
    authQuery.isSuccess,
    authQuery.data,
    setHasConfiguredAuthHeaders,
  ]);

  /** Save Auth Data in Storage */
  useLayoutEffect(() => {
    if (cacheAuth && authQuery.isSuccess) {
      setChromeLocalStorage(authChromeStorageKey, authQuery.data);
    }
  }, [cacheAuth, authChromeStorageKey, authQuery.isSuccess, authQuery.data]);

  return {
    authQuery,
    authQueryKey,
    resetAuthCache,
    authChromeStorageKey,
  };
}
