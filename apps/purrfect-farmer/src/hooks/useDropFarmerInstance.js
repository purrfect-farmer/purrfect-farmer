import utils from "@/lib/utils";
import { useLayoutEffect, useRef } from "react";

import useUserAgent from "./useUserAgent";

export default function useDropFarmerInstance({
  FarmerClass,
  api,
  logger,
  telegramWebApp,
  joinTelegramLink,
  updateProfile,
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

      /** Set the Update Profile Handler */
      setProfileUpdateHandler(handler) {
        this.updateProfile = handler;
      }

      /** Can Join Telegram Link */
      canJoinTelegramLink() {
        return Boolean(this.joinTelegramLink);
      }

      /** Can Update Profile */
      canUpdateProfile() {
        return Boolean(this.updateProfile);
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
    instance.setProfileUpdateHandler?.(updateProfile);
    instance.setApi?.(api);
    instance.setTelegramWebApp?.(telegramWebApp);
    return instance.configureApi?.(api);
  }, [
    instance,
    userAgent,
    api,
    logger,
    joinTelegramLink,
    updateProfile,
    telegramWebApp,
  ]);

  return instance;
}
