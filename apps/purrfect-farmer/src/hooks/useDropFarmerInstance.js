import { useLayoutEffect, useRef } from "react";

import storage from "@/lib/storage";
import useAppContext from "./useAppContext";
import useChromeStorageKey from "./useChromeStorageKey";
import { useMemo } from "react";
import useUserAgent from "./useUserAgent";
import utils from "@/utils/bundle";

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
      this.configure({ utils });
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
      return this.allowProfileUpdates && Boolean(this.updateProfile);
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
  id,
  api,
  captcha,
  logger,
  telegramWebApp,
  joinTelegramLink,
  updateProfile,
  allowProfileUpdates,
  taskRetries,
}) {
  const storageBaseKey = useChromeStorageKey(`farmer-storage:${id}`);
  const instanceStorage = useMemo(() => {
    return {
      get: (key) => storage.get(`${storageBaseKey}:${key}`),
      set: (key, value) => storage.set(`${storageBaseKey}:${key}`, value),
    };
  }, [storageBaseKey]);

  const instanceRef = useRef(null);
  const userAgent = useUserAgent();
  const { telegramClient } = useAppContext();

  if (!instanceRef.current && FarmerClass) {
    instanceRef.current = createDropFarmerInstance({ FarmerClass });
  }

  const instance = instanceRef.current;

  useLayoutEffect(() => {
    if (!instance) return;
    console.log("Configuring farmer instance...", instance);
    instance.configure({
      userAgent,
      api,
      captcha,
      logger,
      storage: instanceStorage,
      telegramWebApp,
      client: telegramClient.ref.current,
    });
    instance.setTelegramLinkHandler(joinTelegramLink);
    instance.setProfileUpdateHandler(updateProfile);
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
    telegramClient,
    instanceStorage,
  ]);

  /** Apply the profile update permission */
  useLayoutEffect(() => {
    instance?.configure({ allowProfileUpdates });
  }, [instance, allowProfileUpdates]);

  /** Apply the task retries */
  useLayoutEffect(() => {
    instance?.configure({ taskRetries });
  }, [instance, taskRetries]);

  return instance;
}
