import { decryptData, encryptData } from "@/encryption/pure";

export function watchTelegramMiniApp(callback) {
  if (/tgWebAppPlatform=android/.test(location.href)) {
    return callback(true);
  }

  /**
   * @param {MessageEvent} ev
   */
  const handleTelegramMiniApp = (ev) => {
    if (
      ev.source === window &&
      typeof ev.data === "object" &&
      "isTelegramMiniApp" in ev.data
    ) {
      /** Remove Listener */
      window.removeEventListener("message", handleTelegramMiniApp);

      /** Resolve */
      if (ev.data.isTelegramMiniApp) {
        callback(ev.data.isTelegramMiniApp);
      }
    }
  };

  /** Listen for Bridge */
  window.addEventListener("message", handleTelegramMiniApp);
}

export { encryptData, decryptData };
