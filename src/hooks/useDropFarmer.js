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
  tasks = [],
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
        .get(import.meta.env.VITE_APP_FARMER_DATA_URL, {
          signal,
        })
        .then((res) => res.data),
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

  /**  Next task callback */
  const processNextTask = useRefCallback(() => {
    if (zoomies.enabled) {
      zoomies.setCurrent((prev) => {
        if (prev.drop?.id !== id || prev.task === tasks.at(-1)) {
          return {
            drop: zoomies.drops[
              (zoomies.drops.indexOf(prev.drop) + 1) % zoomies.drops.length
            ],
            task: null,
          };
        } else {
          return {
            ...prev,
            task: tasks[(tasks.indexOf(prev.task) + 1) % tasks.length],
          };
        }
      });
    }
  }, [id, tasks, zoomies.enabled, zoomies.drops, zoomies.setCurrent]);

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

  /** ========= Zoomies =========== */
  /** Set Initial Task */
  useEffect(() => {
    if (isZooming && zoomies.current.task === null) {
      zoomies.setCurrent((prev) => {
        return {
          ...prev,
          task: tasks[0],
        };
      });
    }
  }, [id, tasks, isZooming, zoomies.current.task, zoomies.setCurrent]);

  /** Set Auth */
  useEffect(() => {
    if (isZooming) {
      zoomies.setAuth(auth);
    }
  }, [auth, isZooming, zoomies.setAuth]);

  /** Process Next Task if Unable to Obtain Auth within 15sec */
  useEffect(() => {
    if (isZooming) {
      if (telegramWebApp && !auth) {
        /** Set Timeout */
        const timeout = setTimeout(processNextTask, 15_000);

        return () => {
          clearTimeout(timeout);
        };
      }
    }
  }, [auth, telegramWebApp, isZooming, processNextTask]);

  /** Return API and Auth */
  return useValuesMemo({
    id,
    status,
    tasks,
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
    updateQueryData,
    processNextTask,
  });
}
