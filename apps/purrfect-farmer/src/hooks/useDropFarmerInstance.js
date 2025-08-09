import { useLayoutEffect, useRef } from "react";

import useUserAgent from "./useUserAgent";

export default function useDropFarmerInstance({
  FarmerClass,
  api,
  logger,
  telegramWebApp,
  joinTelegramLink,
}) {
  const instanceRef = useRef(null);
  const userAgent = useUserAgent();

  if (!instanceRef.current && FarmerClass) {
    instanceRef.current = new (class extends FarmerClass {
      setTelegramLinkHandler(handler) {
        this.joinTelegramLink = handler;
      }
      canJoinTelegramLink() {
        return Boolean(this.joinTelegramLink);
      }
    })();
  }

  const instance = instanceRef.current;

  useLayoutEffect(() => {
    if (!instance) return;
    instance.setLogger?.(logger);
    instance.setUserAgent?.(userAgent);
    instance.setTelegramLinkHandler?.(joinTelegramLink);
    instance.setApi?.(api);
    instance.setTelegramWebApp?.(telegramWebApp);
    return instance.configureApi?.(api);
  }, [instance, userAgent, logger, joinTelegramLink, api, telegramWebApp]);

  return instance;
}
