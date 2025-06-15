import "./bridge/bridge-main";
import "./webview-proxy/webview-proxy-main";

import { extractInitDataUnsafe } from "@/lib/utils";
import { retrieveRawLaunchParams } from "@telegram-apps/bridge";

import { decryptData, encryptData } from "./content-script-utils";

if (location.host !== "web.telegram.org") {
  /** Post Mini-App Status */
  const postMiniAppStatus = (status) => {
    window.postMessage({ isTelegramMiniApp: status }, "*");
  };

  /** Get TelegramWebApp */
  const getTelegramWebApp = () => {
    const params = new URLSearchParams(retrieveRawLaunchParams());
    const platform = params.get("tgWebAppPlatform");
    const version = params.get("tgWebAppVersion");
    const initData = params.get("tgWebAppData");
    const initDataUnsafe = extractInitDataUnsafe(initData);

    return {
      initData,
      initDataUnsafe,
      platform,
      version,
    };
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
        if (
          ev.source === window &&
          ev.data?.type === "request" &&
          ev.data?.payload
        ) {
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
      /** Post Status */
      postMiniAppStatus(true);

      /** Initialize */
      initialize();

      /** Dispatch Web-App */
      document.addEventListener("DOMContentLoaded", dispatchTelegramWebApp);
    }
  } else {
    /** Wait for load */
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof window.Telegram !== "undefined") {
        /** Post Status */
        postMiniAppStatus(true);

        /** Initialize */
        initialize();

        /** Dispatch Web-App */
        dispatchTelegramWebApp();
      } else {
        /** Post Status */
        postMiniAppStatus(false);
      }
    });
  }
}
