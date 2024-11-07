import FarmerNotification from "@/components/FarmerNotification";
import axios from "axios";
import toast from "react-hot-toast";
import { createElement, useCallback } from "react";
import { delay } from "@/lib/utils";
import { useEffect } from "react";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useAppQuery from "./useAppQuery";
import useRefCallback from "./useRefCallback";
import useTelegramWebApp from "./useTelegramWebApp";
import useValuesMemo from "./useValuesMemo";

export default function useDropFarmer({
  id,
  host,
  apiDelay = 200,
  domains = [],
  authHeaders = ["authorization"],
  extractAuthHeaders,
  configureAuthHeaders,
  fetchAuth,
  notification,
  authQueryOptions,
  autoTasks = [],
}) {
  /** Zoomies */
  const { zoomies } = useAppContext();

  /** Auth */
  const [auth, setAuth] = useState(false);

  /** Domain Matches */
  const domainMatches = useMemo(
    () => domains.map((domain) => `*://${domain}/*`),
    [domains]
  );

  /** TelegramWebApp */
  const { port, telegramWebApp, resetTelegramWebApp } = useTelegramWebApp(host);

  /** Axios Instance */
  const api = useMemo(() => axios.create(), []);

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

  /** Remove Queries */
  const removeQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: [id] });
  }, [id, queryClient.removeQueries]);

  /** Reset Auth */
  const resetAuth = useCallback(() => {
    setAuth(false);
    removeQueries();
  }, [setAuth, removeQueries]);

  /** Run the next task */
  const processNextTask = useRefCallback(() => {
    if (!zoomies.enabled) return;
    else if (zoomies.currentTask === autoTasks.at(-1)) {
      zoomies.processNextDrop();
    } else {
      zoomies.setCurrentTask((prev) => {
        const currentTaskIndex = autoTasks.findIndex((item) => item === prev);
        const nextTask = autoTasks[currentTaskIndex + 1];

        return nextTask;
      });
    }
  }, [
    zoomies.enabled,
    zoomies.currentTask,
    zoomies.setCurrentTask,
    zoomies.processNextDrop,
    autoTasks,
  ]);

  /** Enforce only one request */
  useEffect(() => {
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
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => Promise.resolve(response),
      (error) => {
        if ([401, 403, 418].includes(error?.response?.status)) {
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
  useEffect(() => {
    /** Requires domain matches */
    /** Don't watch requests without Telegram Web App  */
    if (domainMatches.length < 1 || !telegramWebApp) {
      return;
    }

    const getRequestHeaders = (details) =>
      extractAuthHeaders
        ? extractAuthHeaders(details.requestHeaders, telegramWebApp)
        : details.requestHeaders.filter((header) => {
            return authHeaders.includes(header.name.toLowerCase());
          });

    const handleWebRequest = (details) => {
      let configured = false;

      getRequestHeaders(details).forEach((header) => {
        if (header.value !== api.defaults.headers.common[header.name]) {
          api.defaults.headers.common[header.name] = header.value;

          if (header.value) {
            configured = true;
          }
        }
      });

      if (configured) {
        setAuth(true);
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
    domainMatches,
    authHeaders,
    extractAuthHeaders,
    telegramWebApp,
    api,
    setAuth,
  ]);

  /** Handle auth query */
  useEffect(() => {
    if (authQuery.data) {
      if (configureAuthHeaders) {
        configureAuthHeaders(api, telegramWebApp, authQuery.data);
      }

      setAuth(true);
    } else if (typeof fetchAuth !== "undefined") {
      setAuth(false);
    }
  }, [
    api,
    telegramWebApp,
    authQuery.data,
    configureAuthHeaders,
    setAuth,
    fetchAuth,
  ]);

  /** Create Notification */
  useEffect(() => {
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

  /** Clean Up */
  useEffect(() => () => resetAuth(), [resetAuth]);

  /** Zoomies */
  useEffect(() => {
    if (zoomies.enabled && zoomies.currentDrop.id === id) {
      zoomies.setAuth(auth);

      if (auth) {
        zoomies.setCurrentTask((prev) => prev || autoTasks[0]);
      }
    }
  }, [
    id,
    auth,
    zoomies.enabled,
    zoomies.currentDrop.id,
    zoomies.setAuth,
    zoomies.setCurrentTask,
    autoTasks,
  ]);

  /** Return API and Auth */
  return useValuesMemo({
    id,
    status,
    autoTasks,
    port,
    api,
    auth,
    authQuery,
    authQueryKey,
    queryClient,
    telegramWebApp,
    isMutating,
    zoomies,
    removeQueries,
    resetAuth,
    resetTelegramWebApp,
    updateQueryData,
    processNextTask,
  });
}
