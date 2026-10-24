import "./bridge/bridge-main";
import "./content-script-farmers";

import { WEB_PLATFORM_EXCLUDED_HOSTS, WEB_PLATFORM_REGEXP } from "@/constants";
import { decryptData, encryptData } from "./content-script-utils";

import {
  extractInitDataUnsafe,
  matchTelegramWebUrl,
  readLaunchParams,
} from "@/utils";
import { applyAccountDevice } from "./device-profile/applyDeviceProfile";
import { injectTelegramWebviewProxy } from "./webview-proxy/webview-proxy-main";
import { retrieveRawLaunchParams } from "@telegram-apps/bridge";

const IS_ALLOWED_HOST = !WEB_PLATFORM_EXCLUDED_HOSTS.includes(location.host);

if (!matchTelegramWebUrl()) {
  if (IS_ALLOWED_HOST && WEB_PLATFORM_REGEXP.test(location.href)) {
    /** Replace Platform */
    location.hash = location.hash.replace(
      WEB_PLATFORM_REGEXP,
      "tgWebAppPlatform=android",
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
        const { initData, platform, version, themeParams } =
          readLaunchParams(params);
        const initDataUnsafe = extractInitDataUnsafe(initData);

        return {
          initData,
          initDataUnsafe,
          platform,
          version,
          themeParams,
        };
      };

      /** Dispatch TelegramWebApp */
      const dispatchTelegramWebApp = async () => {
        window.postMessage(
          {
            type: "init",
            payload: encryptData(getTelegramWebApp()),
          },
          "*",
        );
      };

      /** Make the page see the account's phone */
      const overrideDevice = (userAgent) => {
        if (IS_ALLOWED_HOST) {
          const userId = getTelegramWebApp().initDataUnsafe?.user?.id;

          applyAccountDevice(userId, userAgent);
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
                  "*",
                );
              };

              switch (action) {
                case "set-user-agent":
                  overrideDevice(data.userAgent);
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
    } catch (error) {
      console.log("Not running inside Telegram Mini-App:", error);

      /** Post Status */
      postMiniAppStatus(false);
    }
  }
}
