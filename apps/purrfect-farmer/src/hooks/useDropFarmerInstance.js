import utils from "@/lib/utils";
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
      constructor() {
        super();
        this.utils = utils;
      }

      /** Set the Join Telegram Link Handler */
      setTelegramLinkHandler(handler) {
        this.joinTelegramLink = handler;
      }

      /** Can Join Telegram Link */
      canJoinTelegramLink() {
        return Boolean(this.joinTelegramLink);
      }

      /** Get Cookies */
      async getCookies(options) {
        return await this.utils.getCookies(options);
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
