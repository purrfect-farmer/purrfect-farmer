import FarmerNotification from "@/components/FarmerNotification";
import axios from "axios";
import toast from "react-hot-toast";
import { createElement, useCallback } from "react";
import {
  delay,
  getChromeLocalStorage,
  removeChromeLocalStorage,
  setChromeLocalStorage,
} from "@/lib/utils";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useAppQuery from "./useAppQuery";
import useCloudSyncMutation from "./useCloudSyncMutation";
import useRefCallback from "./useRefCallback";
import useTabContext from "./useTabContext";
import useTelegramWebApp from "./useTelegramWebApp";
import useValuesMemo from "./useValuesMemo";

export default function useDropFarmer() {
  const farmer = useTabContext();
  const {
    id,
    host,
    apiOptions,
    apiDelay = 200,
    title,
    icon,
    usesPort = false,
    syncToCloud = false,
    startManually = false,
    cacheAuth = true,
    cacheTelegramWebApp = true,
    telegramLink,
    configureAuthHeaders,
    fetchAuth,
    fetchMeta,
    authQueryOptions,
    metaQueryOptions,
  } = farmer;

  /** Zoomies */
  const {
    zoomies,
    joinTelegramLink: appJoinTelegramLink,
    setActiveTab,
    settings,
  } = useAppContext();

  /** Farmer Title */
  const farmerTitle = settings.farmerTitle;

  /** Should Sync To Cloud */
  const shouldSyncToCloud = settings.enableCloud && syncToCloud;

  /** Cloud Sync Mutation */
  const cloudSyncMutation = useCloudSyncMutation(id);

  /** Has Configured Auth Headers? */
  const [hasConfiguredAuthHeaders, setHasConfiguredAuthHeaders] = useState(
    typeof configureAuthHeaders === "undefined"
  );

  /** Has Started Manually */
  const [hasStartedManually, setHasStartedManually] = useState(false);

  /** Init Reset Count */
  const [initResetCount, setInitResetCount] = useState(0);

  /** TelegramWebApp */
  const { port, telegramWebApp, resetTelegramWebApp } = useTelegramWebApp({
    id,
    host,
    usesPort,
    telegramLink,
    cacheTelegramWebApp,
  });

  /** Api Queue Ref */
  const apiQueueRef = useRef({
    isRequestInProgress: false,
    requestQueue: [],
  });

  /** Axios Instance */
  const api = useMemo(() => axios.create(apiOptions), [apiOptions]);

  /** Is It Zooming? */
  const isZooming = zoomies.enabled && zoomies.current.drop?.id === id;

  /** QueryClient */
  const queryClient = useQueryClient();

  /** Telegram Hash */
  const telegramHash = telegramWebApp?.initDataUnsafe?.hash;

  /** IsMutating */
  const isMutating = useIsMutating({
    mutationKey: [id],
  });

  /** Auth Chrome Storage Key */
  const authChromeStorageKey = `farmer-auth:${id}`;

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
  const authQuery = useAppQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
    ...authQueryOptions,
    enabled: typeof fetchAuth !== "undefined" && Boolean(telegramWebApp),
    queryKey: authQueryKey,
    queryFn: authQueryFn,
  });

  /** Auth */
  const hasPreparedAuth =
    typeof fetchAuth !== "undefined"
      ? authQuery.isSuccess && hasConfiguredAuthHeaders
      : true;

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
  const metaQuery = useAppQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
    ...metaQueryOptions,
    enabled: typeof fetchMeta !== "undefined" && hasPreparedAuth,
    queryKey: metaQueryKey,
    queryFn: metaQueryFn,
  });

  /** Data Query */
  const dataQuery = useAppQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,

    queryKey: ["app", "farmer", "data"],
    queryFn: ({ signal }) =>
      axios
        .get(`${import.meta.env.VITE_APP_FARMER_DATA_URL}?time=${Date.now()}`, {
          signal,
        })
        .then((res) => res.data),
  });

  /** Meta */
  const hasPreparedMeta =
    (typeof fetchMeta !== "undefined" ? metaQuery.isSuccess : true) &&
    hasPreparedAuth;

  /** Started */
  const started =
    (startManually ? hasStartedManually : true) && hasPreparedMeta;

  /** Status */
  const status = useMemo(
    () => (!telegramWebApp ? "pending-webapp" : "pending-init"),
    [telegramWebApp]
  );

  /** Mark as Started */
  const markAsStarted = useCallback(
    (status = true) => setHasStartedManually(status),
    [setHasStartedManually]
  );

  /** Update Query Data */
  const updateQueryData = useCallback(
    (...args) => queryClient.setQueryData(...args),
    [queryClient.setQueryData]
  );

  /** Update Auth Query Data */
  const updateAuthQueryData = useCallback(
    (...args) => updateQueryData(authQueryKey, ...args),
    [updateQueryData, authQueryKey]
  );

  /** Update Meta Query Data */
  const updateMetaQueryData = useCallback(
    (...args) => updateQueryData(metaQueryKey, ...args),
    [updateQueryData, metaQueryKey]
  );

  /** Remove Queries */
  const removeQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: [id] });
  }, [id, queryClient.removeQueries]);

  /** Reset Queries */
  const resetQueries = useCallback(() => {
    queryClient.resetQueries({ queryKey: [id] });
  }, [id, queryClient.resetQueries]);

  /** Reset Chrome Local Storage */
  const resetChromeLocalStorage = useCallback(
    () => removeChromeLocalStorage(authChromeStorageKey),
    [authChromeStorageKey]
  );

  /** Reset Init */
  const resetInit = useCallback(async () => {
    await resetChromeLocalStorage();
    await resetQueries();
    await setHasConfiguredAuthHeaders(false);
    await setHasStartedManually(false);
    await setInitResetCount((prev) => prev + 1);
  }, [
    resetQueries,
    resetChromeLocalStorage,
    setHasConfiguredAuthHeaders,
    setHasStartedManually,
    setInitResetCount,
  ]);

  /** Reset Farmer  */
  const reset = useCallback(async () => {
    await resetTelegramWebApp();
    await resetInit();
  }, [resetTelegramWebApp, resetInit]);

  /** Clear API Queue */
  const clearApiQueue = useCallback(() => {
    apiQueueRef.current.requestQueue = [];
    apiQueueRef.current.isRequestInProgress = false;
  }, []);

  /**  Next task callback */
  const processNextTask = useRefCallback(zoomies.processNextTask);

  /** Join Telegram Link */
  const joinTelegramLink = useCallback(
    async (...args) => {
      try {
        await appJoinTelegramLink(...args);
      } catch {}

      /** Restore Tab */
      setActiveTab(id);
    },
    [id, appJoinTelegramLink, setActiveTab]
  );

  /** Save Auth Data in Storage */
  useLayoutEffect(() => {
    if (cacheAuth && authQuery.isSuccess) {
      setChromeLocalStorage(authChromeStorageKey, authQuery.data);
    }
  }, [cacheAuth, authChromeStorageKey, authQuery.isSuccess, authQuery.data]);

  /** Enforce only one request */
  useLayoutEffect(() => {
    const processNextRequest = () => {
      if (apiQueueRef.current.requestQueue.length === 0) {
        apiQueueRef.current.isRequestInProgress = false;
        return;
      }

      /** Mark Request In Progress */
      apiQueueRef.current.isRequestInProgress = true;

      const { config, resolve } = apiQueueRef.current.requestQueue.shift();

      delay(apiDelay).then(() => {
        resolve(config);
      });
    };

    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (apiQueueRef.current.isRequestInProgress) {
          return new Promise((resolve, reject) => {
            apiQueueRef.current.requestQueue.push({ config, resolve, reject });
          });
        }

        /** Mark Request In Progress */
        apiQueueRef.current.isRequestInProgress = true;

        return delay(apiDelay).then(() => Promise.resolve(config));
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        processNextRequest();
        return response;
      },
      (error) => {
        processNextRequest();
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, apiDelay]);

  /** Response Interceptor */
  useLayoutEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => Promise.resolve(response),
      (error) => {
        if (
          error.config.ignoreUnauthenticatedError !== true &&
          [401, 403, 418].includes(error?.response?.status)
        ) {
          toast.dismiss();
          toast.error("Unauthenticated - Please reload the Bot or Farmer");
          clearApiQueue();
          reset();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [api, clearApiQueue, reset]);

  /** Handle Auth Data  */
  useLayoutEffect(() => {
    if (authQuery.isSuccess && configureAuthHeaders) {
      configureAuthHeaders(api, telegramWebApp, authQuery.data);
      setHasConfiguredAuthHeaders(true);
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

  /**  Zoomies */
  /** Set Started */
  useLayoutEffect(() => {
    if (isZooming) {
      zoomies.setFarmerHasStarted(started);
    }
  }, [started, isZooming, zoomies.setFarmerHasStarted]);

  /** Process Next Drop After 3 Init Reset */
  useLayoutEffect(() => {
    if (isZooming && initResetCount >= 3) {
      zoomies.skipToNextDrop();
    }
  }, [isZooming, initResetCount, zoomies.skipToNextDrop]);

  /** Process Next Drop if Unable to Start within 30sec */
  useLayoutEffect(() => {
    if (isZooming && telegramWebApp && !started) {
      /** Set Timeout */
      const timeout = setTimeout(zoomies.skipToNextDrop, 30_000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [started, telegramWebApp, isZooming, zoomies.skipToNextDrop]);

  /** Sync to Cloud */
  useLayoutEffect(() => {
    if (shouldSyncToCloud && hasPreparedAuth) {
      const { initData, initDataUnsafe } = telegramWebApp;

      cloudSyncMutation
        .mutateAsync({
          id,
          userId: initDataUnsafe.user.id,
          telegramWebApp: {
            initData,
            farmerTitle,
          },
          headers: {
            ...api.defaults.headers.common,
          },
        })
        .then(() => {
          toast.success(`${title} - Synced to Cloud`);
        });
    }
  }, [
    id,
    api,
    title,
    farmerTitle,
    hasPreparedAuth,
    shouldSyncToCloud,
    telegramWebApp,
  ]);

  /** Clean Up */
  useLayoutEffect(() => () => removeQueries(), [removeQueries]);

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
    isMutating,
    zoomies,
    isZooming,
    started,
    farmer,
    reset,
    resetInit,
    resetTelegramWebApp,
    removeQueries,
    updateQueryData,
    updateAuthQueryData,
    updateMetaQueryData,
    processNextTask,
    joinTelegramLink,
    markAsStarted,
    setHasStartedManually,
  });
}
