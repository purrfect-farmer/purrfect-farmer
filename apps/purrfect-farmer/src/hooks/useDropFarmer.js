import BrowserLogger from "@purrfect/shared/lib/BrowserLogger";
import axios from "axios";
import { createQueryClient } from "@/lib/createQueryClient";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";
import useDelayInterceptor from "./useDelayInterceptor";
import useDropFarmerAuth from "./useDropFarmerAuth";
import useDropFarmerCloudSync from "./useDropFarmerCloudSync";
import useDropFarmerInstance from "./useDropFarmerInstance";
import useDropFarmerMeta from "./useDropFarmerMeta";
import useDropFarmerQueryHelper from "./useDropFarmerQueryHelper";
import useDropFarmerState from "./useDropFarmerState";
import useDropFarmerToast from "./useDropFarmerToast";
import useDropFarmerZoomies from "./useDropFarmerZoomies";
import useFarmerDataQuery from "./useFarmerDataQuery";
import useRefCallback from "./useRefCallback";
import useTabContext from "./useTabContext";
import useTelegramWebApp from "./useTelegramWebApp";
import useUnauthorizedInterceptor from "./useUnauthorizedInterceptor";
import useValuesMemo from "./useValuesMemo";

export default function useDropFarmer() {
  const app = useAppContext();
  const farmer = useTabContext();
  const {
    id,
    host,
    icon,
    title,
    apiDelay = 200,
    telegramLink,
    cacheAuth = true,
    cacheTelegramWebApp = true,
    syncToCloud = true,
    authQueryOptions,
    metaQueryOptions,
    FarmerClass,
  } = farmer;

  /** Zoomies */
  const { zoomies, settings, account } = app;

  const {
    resetStates,
    initResetCount,
    hasConfiguredAuthHeaders,
    setInitResetCount,
    setHasConfiguredAuthHeaders,
  } = useDropFarmerState();

  /** QueryClient */
  const queryClient = useMemo(() => createQueryClient(), []);

  /** Logger Instance */
  const logger = useMemo(() => new BrowserLogger(), []);

  /** Axios Instance */
  const api = useMemo(() => axios.create(), []);

  /** API Delay */
  useDelayInterceptor(api, apiDelay);

  /** TelegramWebApp */
  const {
    port,
    telegramWebApp,
    telegramHash,
    telegramUser,
    resetTelegramWebApp,
  } = useTelegramWebApp({
    id,
    host,
    telegramLink,
    cacheTelegramWebApp,
  });

  /** Join Telegram Link */
  const joinTelegramLink = useRefCallback(
    useCallback(
      async (...args) => {
        try {
          await app.joinTelegramLink(...args);
        } catch (e) {
          console.error(e);
        }

        /** Restore Tab */
        if (app.farmerMode === "web") {
          app.setActiveTab(id);
        }
      },
      [id, app.farmerMode, app.joinTelegramLink, app.setActiveTab]
    )
  );

  /** Update Profile */
  const updateProfile = useRefCallback(
    useCallback(
      async (...args) => {
        if (app.farmerMode === "session") {
          const client = app.telegramClient.ref.current;
          if (!client) return;
          return client.updateProfile(...args);
        }
      },
      [app.farmerMode, app.telegramClient]
    )
  );

  /** Instance */
  const instance = useDropFarmerInstance({
    FarmerClass,
    api,
    logger,
    telegramWebApp,
    joinTelegramLink,
    updateProfile,
  });

  /** Data Query */
  const dataQuery = useFarmerDataQuery();

  /** Auth Query */
  const { authQuery, authQueryKey, resetAuthCache } = useDropFarmerAuth({
    id,
    instance,
    cacheAuth,
    queryClient,
    telegramHash,
    authQueryOptions,
    setHasConfiguredAuthHeaders,
  });

  /** Meta Query */
  const { metaQuery, metaQueryKey } = useDropFarmerMeta({
    id,
    instance,
    queryClient,
    telegramHash,
    metaQueryOptions,
    authData: authQuery.data,
    enabled: hasConfiguredAuthHeaders,
  });

  /** Started */
  const started = metaQuery.isSuccess;

  /** Status */
  const status = telegramWebApp === null ? "pending-mini-app" : "pending-init";

  /** Sync Enabled */
  const syncEnabled = settings.enableCloud && syncToCloud;

  /** Should Sync To Cloud */
  const shouldSyncToCloud = hasConfiguredAuthHeaders && syncEnabled;

  /** Zoomies */
  const { isZooming, processNextTask } = useDropFarmerZoomies({
    id,
    zoomies,
    started,
    telegramWebApp,
    initResetCount,
  });

  const {
    updateQueryData,
    updateAuthQueryData,
    updateMetaQueryData,
    removeQueries,
    resetQueries,
  } = useDropFarmerQueryHelper({
    id,
    queryClient,
    authQuery,
    metaQuery,
  });

  /** Reset Init */
  const resetInit = useCallback(async () => {
    await resetAuthCache();
    await removeQueries();
    await resetStates();
    await setInitResetCount((prev) => prev + 1);
  }, [removeQueries, resetAuthCache, resetStates, setInitResetCount]);

  /** Reset Farmer  */
  const reset = useCallback(async () => {
    await resetTelegramWebApp();
    await resetInit();
  }, [resetTelegramWebApp, resetInit]);

  /** Sync to Cloud */
  useDropFarmerCloudSync({
    id,
    title,
    account,
    instance,
    shouldSyncToCloud,
  });

  /** Create Notification */
  useDropFarmerToast({
    id,
    title,
    icon,
    started,
    onClick: useCallback(() => {
      return app.dispatchAndSetActiveTab(id);
    }, [id, app.dispatchAndSetActiveTab]),
  });

  /** Response Interceptor */
  useUnauthorizedInterceptor(api, reset);

  /** Cleanup */
  useLayoutEffect(() => () => queryClient.cancelQueries(), [queryClient]);

  return useValuesMemo({
    id,
    port,
    icon,
    title,
    status,
    api,
    instance,
    logger,
    queryClient,
    telegramWebApp,
    telegramUser,
    telegramHash,
    auth: hasConfiguredAuthHeaders,
    authQuery,
    authQueryKey,
    metaQuery,
    metaQueryKey,
    dataQuery,
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
  });
}
