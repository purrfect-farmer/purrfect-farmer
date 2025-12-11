import utils from "@/utils/bundle";
import { useLayoutEffect, useRef } from "react";

import useUserAgent from "./useUserAgent";

/**
 *
 * @param {Object} param0
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} param0.FarmerClass
 * @returns {import("@purrfect/shared/lib/BaseFarmer.js").default}
 */
const createDropFarmerInstance = ({ FarmerClass }) => {
  const InstanceClass = class extends FarmerClass {
    /** Constructor */
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
  };

  return new InstanceClass();
};

/**
 *
 * @param {Object} param0
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} param0.FarmerClass
 * @returns {import("@purrfect/shared/lib/BaseFarmer.js").default}
 */
export default function useDropFarmerInstance({
  FarmerClass,
  api,
  captcha,
  logger,
  telegramWebApp,
  joinTelegramLink,
  updateProfile,
}) {
  const instanceRef = useRef(null);
  const userAgent = useUserAgent();

  if (!instanceRef.current && FarmerClass) {
    instanceRef.current = createDropFarmerInstance({ FarmerClass });
  }

  const instance = instanceRef.current;

  useLayoutEffect(() => {
    if (!instance) return;
    instance.setUserAgent?.(userAgent);
    instance.setApi?.(api);
    instance.setCaptcha?.(captcha);
    instance.setLogger?.(logger);
    instance.setTelegramLinkHandler?.(joinTelegramLink);
    instance.setProfileUpdateHandler?.(updateProfile);
    instance.setTelegramWebApp?.(telegramWebApp);
    return instance.configureApi?.(api);
  }, [
    instance,
    userAgent,
    api,
    captcha,
    logger,
    joinTelegramLink,
    updateProfile,
    telegramWebApp,
  ]);

  return instance;
}
