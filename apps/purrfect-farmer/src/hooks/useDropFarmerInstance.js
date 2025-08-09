import { useLayoutEffect, useRef } from "react";

export default function useDropFarmerInstance({
  FarmerClass,
  api,
  logger,
  telegramWebApp,
  joinTelegramLink,
}) {
  const instanceRef = useRef(null);

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
    instance.setTelegramLinkHandler?.(joinTelegramLink);
    instance.setApi?.(api);
    instance.setTelegramWebApp?.(telegramWebApp);
    return instance.configureApi?.(api);
  }, [instance, logger, joinTelegramLink, api, telegramWebApp]);

  return instance;
}
