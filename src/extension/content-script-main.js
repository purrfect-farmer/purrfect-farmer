import "./bridge/bridge-main";
import "./mini-app/mini-app-telegram-webview-proxy-main";
import { decryptData, encryptData } from "./content-script-utils";

if (location.host !== "web.telegram.org") {
  /** Post Mini-App Status */
  const postMiniAppStatus = (status) => {
    window.postMessage({ isTelegramMiniApp: status }, "*");
  };

  /** Get TelegramWebApp */
  const getTelegramWebApp = () => {
    if (window.Telegram?.WebApp) {
      const { initData, initDataUnsafe, platform, version } =
        window.Telegram?.WebApp;

      return {
        initData,
        initDataUnsafe,
        platform,
        version,
      };
    }
  };

  /** Dispatch TelegramWebApp */
  const dispatchTelegramWebApp = async () => {
    window.postMessage(
      {
        type: "init",
        payload: encryptData(getTelegramWebApp()),
      },
      "*"
    );
  };

  const overrideUserAgent = (userAgent) => {
    /** Override User Agent */
    Object.defineProperty(navigator, "userAgent", {
      get: () => userAgent,
      configurable: true,
    });
  };

  /** Initialize */
  const initialize = () => {
    /** Handle Messages */
    window.addEventListener("message", (ev) => {
      try {
        if (ev.source === window && ev.data?.payload) {
          const { id, payload } = ev.data;
          const { action, data } = decryptData(payload);
          const reply = (data) => {
            window.postMessage(
              {
                id,
                type: "response",
                payload: encryptData(data),
              },
              "*"
            );
          };

          switch (action) {
            case "set-user-agent":
              overrideUserAgent(data.userAgent);
              reply(true);
              break;

            case "get-telegram-web-app":
              reply(getTelegramWebApp());
              break;
            case "open-telegram-link":
              window.Telegram?.WebApp?.disableClosingConfirmation();
              window.Telegram?.WebApp?.openTelegramLink(data.url);
              reply(true);
              break;

            case "close-bot":
              window.Telegram?.WebApp?.disableClosingConfirmation();
              window.Telegram?.WebApp?.close();
              reply(true);
              break;
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  if (location.hash.includes("tgWebAppData")) {
    const webPlatFormRegExp = /tgWebAppPlatform=(webk|weba|web)/;

    /** Replace Platform */
    if (webPlatFormRegExp.test(location.href)) {
      location.hash = location.hash.replace(
        webPlatFormRegExp,
        "tgWebAppPlatform=android"
      );
      location.reload();
    } else {
      postMiniAppStatus(true);
      initialize();
      document.addEventListener("DOMContentLoaded", dispatchTelegramWebApp);
    }
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof window.Telegram !== "undefined") {
        postMiniAppStatus(true);
        initialize();
      } else {
        postMiniAppStatus(false);
      }
    });
  }
}
