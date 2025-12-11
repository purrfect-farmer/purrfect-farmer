import { createListener } from "@/utils";
export { encryptData, decryptData } from "@/encryption/pure";

export const watchTelegramMiniApp = (callback) => {
  if (/tgWebAppPlatform=android/.test(location.href)) {
    return callback(true);
  }

  /** Listen for Mini-App */
  window.addEventListener(
    "message",
    createListener(
      /**
       * @param {Function} listener
       * @param {MessageEvent} ev
       */
      (listener, ev) => {
        if (
          ev.source === window &&
          typeof ev.data === "object" &&
          "isTelegramMiniApp" in ev.data
        ) {
          /** Remove Listener */
          window.removeEventListener("message", listener);

          /** Resolve */
          if (ev.data.isTelegramMiniApp) {
            callback(ev.data.isTelegramMiniApp);
          }
        }
      }
    )
  );
};
