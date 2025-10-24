import "./bridge/bridge-main";

import {
  TELEGRAM_WEB_HOSTS,
  WEB_PLATFORM_EXCLUDED_HOSTS,
  WEB_PLATFORM_REGEXP,
} from "@/constants";
import { extractInitDataUnsafe } from "@/lib/utils";
import { retrieveRawLaunchParams } from "@telegram-apps/bridge";

import { decryptData, encryptData } from "./content-script-utils";
import { injectTelegramWebviewProxy } from "./webview-proxy/webview-proxy-main";

const IS_ALLOWED_HOST = !WEB_PLATFORM_EXCLUDED_HOSTS.includes(location.host);

if (!TELEGRAM_WEB_HOSTS.includes(location.host)) {
  if (IS_ALLOWED_HOST && WEB_PLATFORM_REGEXP.test(location.href)) {
    /** Replace Platform */
    location.hash = location.hash.replace(
      WEB_PLATFORM_REGEXP,
      "tgWebAppPlatform=android"
    );
    location.reload();
  } else {
    /** Post Mini-App Status */
    const postMiniAppStatus = (status) => {
      window.postMessage({ isTelegramMiniApp: status }, "*");
    };

    try {
      const params = retrieveRawLaunchParams();

      /** Get TelegramWebApp */
      const getTelegramWebApp = () => {
        const search = new URLSearchParams(params);
        const platform = search.get("tgWebAppPlatform");
        const version = search.get("tgWebAppVersion");
        const initData = search.get("tgWebAppData");
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
        if (IS_ALLOWED_HOST) {
          Object.defineProperty(navigator, "userAgent", {
            get: () => userAgent,
            configurable: true,
          });
        }
      };

      /** Initialize */
      const initialize = () => {
        /** Inject Webview Proxy */
        if (IS_ALLOWED_HOST) {
          injectTelegramWebviewProxy();
        }

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

      /** Post Status */
      postMiniAppStatus(true);

      /** Initialize */
      initialize();

      /** Dispatch Web-App */
      dispatchTelegramWebApp();
    } catch {
      /** Post Status */
      postMiniAppStatus(false);
    }
  }
}
