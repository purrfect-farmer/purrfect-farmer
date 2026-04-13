import { sendWebviewMessage } from "@/utils";
import updateNetRules from "@/lib/updateNetRules";
import useAppContext from "./useAppContext";
import useCloudSubscriptionQuery from "./useCloudSubscriptionQuery";
import { useEffect } from "react";
import useParsedProxy from "./useParsedProxy";

export default function useProxy(app) {
  const { account, sharedSettings, updateSharedSettings } =
    useAppContext() || app;
  const { shareCloudProxy } = sharedSettings;

  const subscriptionQuery = useCloudSubscriptionQuery(app);
  const cloudProxy = subscriptionQuery.data?.account?.proxy;
  const parsedCloudProxy = useParsedProxy(cloudProxy);

  const isProxyAllowedInWhisker =
    !import.meta.env.VITE_WHISKER || sharedSettings.allowProxies;

  const canUpdateProxy =
    account.active &&
    shareCloudProxy &&
    parsedCloudProxy &&
    isProxyAllowedInWhisker;

  const shouldUpdateProxy = canUpdateProxy
    ? !sharedSettings.proxyEnabled ||
      sharedSettings.proxyHost !== parsedCloudProxy.proxyHost ||
      sharedSettings.proxyPort !== parsedCloudProxy.proxyPort ||
      sharedSettings.proxyUsername !== parsedCloudProxy.proxyUsername ||
      sharedSettings.proxyPassword !== parsedCloudProxy.proxyPassword
    : false;

  /** Update Proxy */
  useEffect(() => {
    if (shouldUpdateProxy) {
      console.log("Updating proxy configurations...");
      if (import.meta.env.VITE_WHISKER) {
        console.log("Sending proxy configurations to Whiskers...");
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
          false,
        );
      }
    }
  }, [shouldUpdateProxy, parsedCloudProxy, updateSharedSettings]);

  /** Update Net Rules when Proxy Settings Change */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      console.log("Updating Net Rules due to proxy configurations...");
      updateNetRules();
    }
  }, [
    sharedSettings.allowProxies,
    sharedSettings.proxyEnabled,
    sharedSettings.proxyHost,
    sharedSettings.proxyPort,
    sharedSettings.proxyUsername,
    sharedSettings.proxyPassword,
  ]);
}
