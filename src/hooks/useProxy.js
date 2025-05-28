import { sendWebviewMessage } from "@/lib/utils";
import { useEffect } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";
import useCloudSubscriptionQuery from "./useCloudSubscriptionQuery";

export default function useProxy(app) {
  const { account, settings, sharedSettings, updateSharedSettings } =
    useAppContext() || app;
  const { shareCloudProxy } = settings;

  const subscriptionQuery = useCloudSubscriptionQuery(app);
  const cloudProxy = subscriptionQuery.data?.account?.proxy;
  const parsedCloudProxy = useMemo(() => {
    if (!cloudProxy) return null;
    const [user, server] = cloudProxy.split("@");
    const [proxyHost, proxyPort] = server.split(":");
    const [proxyUsername, proxyPassword] = user.split(":");

    return {
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    };
  }, [cloudProxy]);

  /** Update Proxy */
  useEffect(() => {
    if (!account.active || !shareCloudProxy || !parsedCloudProxy) return;
    else if (
      !sharedSettings.proxyEnabled ||
      sharedSettings.proxyHost !== parsedCloudProxy.proxyHost ||
      sharedSettings.proxyPort !== parsedCloudProxy.proxyPort ||
      sharedSettings.proxyUsername !== parsedCloudProxy.proxyUsername ||
      sharedSettings.proxyPassword !== parsedCloudProxy.proxyPassword
    ) {
      if (import.meta.env.VITE_WHISKER) {
        sendWebviewMessage({
          action: "set-proxy",
          data: {
            ...parsedCloudProxy,
            proxyEnabled: true,
          },
        });
      } else {
        updateSharedSettings(
          {
            ...parsedCloudProxy,
            proxyEnabled: true,
          },
          false
        );
      }
    }
  }, [
    account.active,
    sharedSettings.proxyEnabled,
    sharedSettings.proxyHost,
    sharedSettings.proxyPort,
    sharedSettings.proxyUsername,
    sharedSettings.proxyPassword,
    parsedCloudProxy,
    shareCloudProxy,
    updateSharedSettings,
  ]);
}
