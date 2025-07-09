import FarmerNotification from "@/components/FarmerNotification";
import axios from "axios";
import toast from "react-hot-toast";
import { createElement, useCallback } from "react";
import { createQueryClient } from "@/lib/createQueryClient";
import {
  delay,
  getChromeLocalStorage,
  setChromeLocalStorage,
} from "@/lib/utils";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useAppQuery from "./useAppQuery";
import useChromeStorageKey from "./useChromeStorageKey";
import useCloudSyncMutation from "./useCloudSyncMutation";
import useFarmerDataQuery from "./useFarmerDataQuery";
import useTabContext from "./useTabContext";
import useTelegramWebApp from "./useTelegramWebApp";
import useValuesMemo from "./useValuesMemo";

export default function useDropFarmer() {
  const app = useAppContext();
  const farmer = useTabContext();
  const {
    id,
    host,
    apiOptions,
    apiDelay = 500,
    title,
    icon,
    syncToCloud = false,
    cacheAuth = true,
    telegramLink,
    configureApi,
    configureAuthHeaders,
    fetchAuth,
    fetchMeta,
    authQueryOptions,
    metaQueryOptions,
  } = farmer;

  const { settings, account, dispatchAndSetActiveTab } = app;

  /** Should Sync To Cloud */
  const shouldSyncToCloud = settings.enableCloud && syncToCloud;

  /** Has Configured Api? */
  const [hasConfiguredApi, setHasConfiguredApi] = useState(
    typeof configureApi === "undefined"
  );

  /** Has Configured Auth Headers? */
  const [hasConfiguredAuthHeaders, setHasConfiguredAuthHeaders] = useState(
    typeof configureAuthHeaders === "undefined"
  );

  /** TelegramWebApp */
  const { port, telegramWebApp } = useTelegramWebApp({
    id,
    host,
    telegramLink,
  });

  /** Axios Instance */
  const api = useMemo(() => axios.create(apiOptions), [apiOptions]);

  /** QueryClient */
  const queryClient = useMemo(() => createQueryClient(), []);

  /** Telegram Hash */
  const telegramHash = telegramWebApp?.initDataUnsafe?.hash;

  /** Telegram User */
  const telegramUser = telegramWebApp?.initDataUnsafe?.user;

  /** Cloud Sync Mutation */
  const cloudSyncMutation = useCloudSyncMutation(id, queryClient);

  /** Has Initialized? */
  const hasInitialized = hasConfiguredApi && Boolean(telegramWebApp);

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
            (result) => result || fetchAuth(api, telegramWebApp)
          )
        : fetchAuth(api, telegramWebApp),
    [
      /** Deps */
      api,
      telegramWebApp,
      fetchAuth,
      authChromeStorageKey,
      cacheAuth,
    ]
  );

  /** Auth Query */
  const authQuery = useAppQuery(
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: false,
      ...authQueryOptions,
      enabled: typeof fetchAuth !== "undefined" && hasInitialized,
      queryKey: authQueryKey,
      queryFn: authQueryFn,
    },
    queryClient
  );

  /** Auth */
  const hasPreparedAuth =
    typeof fetchAuth !== "undefined"
      ? authQuery.isSuccess && hasConfiguredAuthHeaders
      : hasInitialized;

  /** Meta Query Key */
  const metaQueryKey = useMemo(
    () => [id, "meta", telegramHash],
    [id, telegramHash]
  );

  /** Meta QueryFn */
  const metaQueryFn = useCallback(
    () => fetchMeta(api, telegramWebApp, authQuery.data),
    [api, telegramWebApp, authQuery.data, fetchMeta]
  );

  /** Meta Query */
  const metaQuery = useAppQuery(
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: false,
      ...metaQueryOptions,
      enabled: typeof fetchMeta !== "undefined" && hasPreparedAuth,
      queryKey: metaQueryKey,
      queryFn: metaQueryFn,
    },
    queryClient
  );

  /** Data Query */
  const dataQuery = useFarmerDataQuery();

  /** Meta */
  const hasPreparedMeta =
    (typeof fetchMeta !== "undefined" ? metaQuery.isSuccess : true) &&
    hasPreparedAuth;

  /** Started */
  const started = hasPreparedMeta;

  /** Status */
  const status = useMemo(
    () => (!telegramWebApp ? "pending-webapp" : "pending-init"),
    [telegramWebApp]
  );

  /** Save Auth Data in Storage */
  useLayoutEffect(() => {
    if (cacheAuth && authQuery.isSuccess) {
      setChromeLocalStorage(authChromeStorageKey, authQuery.data);
    }
  }, [cacheAuth, authChromeStorageKey, authQuery.isSuccess, authQuery.data]);

  /** Set Whisker Origin */
  useLayoutEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      api.defaults.headers.common["x-whisker-origin"] = `https://${host}`;
    }
  }, [api, host]);

  /** Configure API  */
  useLayoutEffect(() => {
    if (configureApi && telegramWebApp) {
      const cleanup = configureApi(api, telegramWebApp);
      setHasConfiguredApi(true);

      return cleanup;
    }
  }, [api, configureApi, telegramWebApp, setHasConfiguredApi]);

  /** Add delay interceptor */
  useLayoutEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      return delay(apiDelay).then(() => Promise.resolve(config));
    });

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [api, apiDelay]);

  /** Handle Auth Data  */
  useLayoutEffect(() => {
    if (authQuery.isSuccess && configureAuthHeaders) {
      const cleanup = configureAuthHeaders(api, telegramWebApp, authQuery.data);
      setHasConfiguredAuthHeaders(true);

      return cleanup;
    }
  }, [
    api,
    telegramWebApp,
    authQuery.isSuccess,
    authQuery.data,
    configureAuthHeaders,
    setHasConfiguredAuthHeaders,
  ]);

  /** Create Notification */
  useLayoutEffect(() => {
    if (started) {
      toast.success(
        (t) =>
          createElement(FarmerNotification, {
            t,
            id,
            title,
            onClick: () => dispatchAndSetActiveTab(id),
          }),
        {
          icon: createElement("img", {
            src: icon,
            className: "w-6 h-6 rounded-full",
          }),
          id: `${id}-farmer`,
          duration: 2000,
        }
      );
    }

    return () => {
      toast.dismiss(`${id}-farmer`);
    };
  }, [id, started]);

  /** Sync to Cloud */
  useLayoutEffect(() => {
    if (shouldSyncToCloud && hasPreparedAuth) {
      cloudSyncMutation
        .mutateAsync({
          title: account.title,
          farmer: id,
          userId: telegramWebApp.initDataUnsafe.user.id,
          initData: telegramWebApp.initData,
          headers: Object.fromEntries(
            Object.entries(api.defaults.headers.common).filter(
              ([k]) => !["x-whisker-origin"].includes(k)
            )
          ),
        })
        .then(() => {
          toast.success(`${title} - Synced to Cloud`);
        });
    }
  }, [
    id,
    api,
    title,
    account.title,
    hasPreparedAuth,
    shouldSyncToCloud,
    telegramWebApp,
  ]);

  return useValuesMemo({
    id,
    host,
    status,
    port,
    title,
    icon,
    api,
    auth: hasPreparedAuth,
    authQuery,
    authQueryKey,
    metaQuery,
    metaQueryKey,
    dataQuery,
    queryClient,
    telegramWebApp,
    telegramUser,
    started,
    farmer,
  });
}
