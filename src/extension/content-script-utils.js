import { decryptData, encryptData } from "@/encryption/pure";

export function watchTelegramMiniApp() {
  return new Promise((resolve, reject) => {
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
          resolve(true);
        } else {
          reject(false);
        }
      }
    };

    /** Listen for Bridge */
    window.addEventListener("message", handleTelegramMiniApp);
  });
}

export { encryptData, decryptData };
