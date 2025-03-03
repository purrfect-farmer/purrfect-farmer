import FarmerNotification from "@/components/FarmerNotification";
import axios from "axios";
import toast from "react-hot-toast";
import { createElement, useCallback } from "react";
import { delay } from "@/lib/utils";
import {
  useDeepCompareLayoutEffect,
  useDeepCompareMemo,
} from "use-deep-compare";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useAppQuery from "./useAppQuery";
import useCloudSyncMutation from "./useCloudSyncMutation";
import useRefCallback from "./useRefCallback";
import useTelegramWebApp from "./useTelegramWebApp";
import useValuesMemo from "./useValuesMemo";

export default function useDropFarmer({
  id,
  host,
  apiOptions,
  apiDelay = 200,
  domains = [],
  authHeaders = ["authorization"],
  syncToCloud = false,
  extractAuthHeaders,
  configureAuthHeaders,
  fetchAuth,
  notification,
  authQueryOptions,
}) {
  /** Zoomies */
  const {
    zoomies,
    joinTelegramLink: coreJoinTelegramLink,
    setActiveTab,
    userAgent,
    settings,
  } = useAppContext();

  /** Farmer Title */
  const farmerTitle = settings.farmerTitle;

  /** Enable Cloud */
  const enableCloud = settings.enableCloud;

  /** Should Sync */
  const shouldSync = enableCloud && syncToCloud;

  /** Cloud Sync Mutation */
  const cloudSyncMutation = useCloudSyncMutation(id);

  /** Auth */
  const [authState, setAuthState] = useState(false);

  /** Auth Reset Count */
  const [authResetCount, setAuthResetCount] = useState(0);

  /** Domain Matches */
  const domainMatches = useDeepCompareMemo(
    () => domains.map((domain) => `*://${domain}/*`),
    [domains]
  );

  /** TelegramWebApp */
  const { port, telegramWebApp, resetTelegramWebApp } = useTelegramWebApp(host);

  /** Axios Instance */
  const api = useMemo(() => axios.create(apiOptions), [apiOptions]);

  /** Is It Zooming? */
  const isZooming = zoomies.enabled && zoomies.current.drop?.id === id;

  /** QueryClient */
  const queryClient = useQueryClient();

  /** IsMutating */
  const isMutating = useIsMutating({
    mutationKey: [id],
  });

  /** Query Key */
  const authQueryKey = useMemo(
    () => [id, "auth", telegramWebApp?.initDataUnsafe?.hash],
    [id, telegramWebApp]
  );

  /** QueryFn */
  const authQueryFn = useCallback(
    () => fetchAuth(api, telegramWebApp),
    [api, telegramWebApp, fetchAuth]
  );

  /** Auth */
  const authQuery = useAppQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...authQueryOptions,
    enabled: typeof fetchAuth === "function" && Boolean(telegramWebApp),
    queryKey: authQueryKey,
    queryFn: authQueryFn,
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

  /** Auth */
  const auth =
    typeof fetchAuth === "function" ? authQuery.isSuccess : authState;

  /** Status */
  const status = useMemo(
    () => (!telegramWebApp ? "pending-webapp" : "pending-auth"),
    [telegramWebApp]
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

  /** Remove Queries */
  const removeQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: [id] });
  }, [id, queryClient.removeQueries]);

  /** Reset Queries */
  const resetQueries = useCallback(() => {
    queryClient.resetQueries({ queryKey: [id] });
  }, [id, queryClient.resetQueries]);

  /** Reset Auth */
  const resetAuth = useCallback(() => {
    setAuthState(false);
    setAuthResetCount((prev) => prev + 1);
    resetQueries();
  }, [setAuthState, setAuthResetCount, resetQueries]);

  /** Reset Farmer  */
  const reset = useCallback(() => {
    resetTelegramWebApp();
    resetAuth();
  }, [resetTelegramWebApp, resetAuth]);

  /**  Next task callback */
  const processNextTask = useRefCallback(zoomies.processNextTask, [
    zoomies.processNextTask,
  ]);

  /** Join Telegram Link */
  const joinTelegramLink = useCallback(
    async (...args) => {
      try {
        await coreJoinTelegramLink(...args);
      } catch {}

      /** Restore Tab */
      setActiveTab(id);
    },
    [id, coreJoinTelegramLink, setActiveTab]
  );

  /** Enforce only one request */
  useLayoutEffect(() => {
    let isRequestInProgress = false;
    let requestQueue = [];

    const processNextRequest = () => {
      if (requestQueue.length === 0) {
        isRequestInProgress = false;
        return;
      }

      isRequestInProgress = true;

      const { config, resolve } = requestQueue.shift();

      delay(apiDelay).then(() => {
        resolve(config);
      });
    };

    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (isRequestInProgress) {
          return new Promise((resolve, reject) => {
            requestQueue.push({ config, resolve, reject });
          });
        }

        isRequestInProgress = true;

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
          resetAuth();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [api, resetAuth]);

  /** Handle Web Request */
  useDeepCompareLayoutEffect(() => {
    /** Requires domain matches */
    /** Don't watch requests without Telegram Web App  */
    if (auth || domainMatches.length < 1 || !telegramWebApp) {
      return;
    }

    const getRequestHeaders = (details) =>
      extractAuthHeaders
        ? extractAuthHeaders(details.requestHeaders, telegramWebApp)
        : details.requestHeaders.filter((header) => {
            return authHeaders.includes(header.name.toLowerCase());
          });

    const handleWebRequest = (details) => {
      const headers = getRequestHeaders(details);
      const requiredHeadersLength = extractAuthHeaders
        ? headers.length
        : authHeaders.length;

      const configured =
        headers.length &&
        headers.length === requiredHeadersLength &&
        headers
          .map((header) => {
            if (header.value !== api.defaults.headers.common[header.name]) {
              api.defaults.headers.common[header.name] = header.value;

              if (header.value) {
                return true;
              }
            }

            return false;
          })
          .every(Boolean);

      if (configured) {
        setAuthState(true);
      }
    };

    chrome.webRequest.onBeforeSendHeaders.addListener(
      handleWebRequest,
      {
        urls: domainMatches,
      },
      ["requestHeaders"]
    );

    return () => {
      chrome.webRequest.onBeforeSendHeaders.removeListener(handleWebRequest);
    };
  }, [
    auth,
    domainMatches,
    authHeaders,
    extractAuthHeaders,
    telegramWebApp,
    api,
    setAuthState,
  ]);

  /** Handle Auth Data  */
  useLayoutEffect(() => {
    if (authQuery.data && configureAuthHeaders) {
      configureAuthHeaders(api, telegramWebApp, authQuery.data);
    }
  }, [api, telegramWebApp, authQuery.data, configureAuthHeaders]);

  /** Create Notification */
  useLayoutEffect(() => {
    if (auth) {
      toast.success(
        (t) =>
          createElement(FarmerNotification, {
            t,
            id,
            notification,
          }),
        {
          icon: createElement("img", {
            src: notification.icon,
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
  }, [id, auth]);

  /** ========= Zoomies =========== */
  /** Set Auth */
  useLayoutEffect(() => {
    if (isZooming) {
      zoomies.setAuth(auth);
    }
  }, [auth, isZooming, zoomies.setAuth]);

  /** Process Next Task After 3 Auth Reset */
  useLayoutEffect(() => {
    if (isZooming && authResetCount >= 3) {
      zoomies.skipToNextDrop();
    }
  }, [isZooming, authResetCount, zoomies.skipToNextDrop]);

  /** Process Next Task if Unable to Obtain Auth within 30sec */
  useLayoutEffect(() => {
    if (isZooming) {
      if (telegramWebApp && !auth) {
        /** Set Timeout */
        const timeout = setTimeout(zoomies.skipToNextDrop, 30_000);

        return () => {
          clearTimeout(timeout);
        };
      }
    }
  }, [auth, telegramWebApp, isZooming, zoomies.skipToNextDrop]);

  /** Sync to Cloud */
  useLayoutEffect(() => {
    if (shouldSync && auth) {
      const { initData, initDataUnsafe } = telegramWebApp;

      cloudSyncMutation
        .mutateAsync({
          id,
          userId: telegramWebApp.initDataUnsafe.user.id,
          telegramWebApp: {
            initData,
            initDataUnsafe,
            farmerTitle,
          },
          headers: {
            ...api.defaults.headers.common,
            "User-Agent": userAgent,
          },
        })
        .then(() => {
          toast.success(`${notification.title} - Synced to Cloud`);
        });
    }
  }, [
    id,
    api,
    auth,
    userAgent,
    farmerTitle,
    shouldSync,
    telegramWebApp,
    notification.title,
  ]);

  /** Clean Up */
  useLayoutEffect(() => () => removeQueries(), [removeQueries]);

  /** Return API and Auth */
  return useValuesMemo({
    id,
    host,
    status,
    port,
    api,
    auth,
    authQuery,
    authQueryKey,
    dataQuery,
    queryClient,
    telegramWebApp,
    isMutating,
    zoomies,
    isZooming,
    removeQueries,
    resetAuth,
    resetTelegramWebApp,
    reset,
    updateQueryData,
    updateAuthQueryData,
    processNextTask,
    joinTelegramLink,
  });
}
