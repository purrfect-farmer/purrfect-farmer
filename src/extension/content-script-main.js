import { withValue } from "@/lib/utils";

import {
  decryptData,
  encryptData,
  watchTelegramMiniApp,
} from "./content-script-utils";

/** Initial Location Hash */
const INITIAL_LOCATION = location.href;

/** Telegram Web Script */
const TG_WEB_SCRIPT_SRC = "https://telegram.org/js/telegram-web-app.js";

if (import.meta.env.VITE_BRIDGE) {
  /**
   * @param {MessageEvent} ev
   */
  const handleBridge = (ev) => {
    if (
      ev.source === window &&
      typeof ev.data === "object" &&
      ev.data?.bridgeId
    ) {
      /** Remove Listener */
      window.removeEventListener("message", handleBridge);

      /** Expose */
      if (ev.data.expose) {
        window.BRIDGE_ID = ev.data?.bridgeId;
      }
    }
  };

  /** Listen for Bridge */
  window.addEventListener("message", handleBridge);
}

watchTelegramMiniApp().then(() => {
  /** Override User Agent */
  const overrideUserAgent = (userAgent) => {
    /** Override User Agent */
    Object.defineProperty(navigator, "userAgent", {
      get: () => userAgent,
      configurable: true,
    });
  };

  /** Override Parent */
  window.parent = withValue(
    window.parent.postMessage.bind(window.parent),
    (postMessage) =>
      new Proxy(
        {},
        {
          get(target, p) {
            if (p === "postMessage") {
              return (...args) => {
                const inputs = [...args];

                if (inputs.length > 1) {
                  if (typeof inputs[1] === "object") {
                    inputs[1].targetOrigin = "*";
                  } else {
                    inputs[1] = "*";
                  }
                }
                postMessage(...inputs);
              };
            } else {
              if (typeof window[p] === "function") {
                return window[p].bind(window);
              }

              return window[p];
            }
          },
        }
      )
  );

  /** Modify Race */
  Promise.race = withValue(
    Promise.race.bind(Promise),
    (race) =>
      (...args) =>
        race(...args).catch((err) => {
          if (err.type === "ERR_TIMED_OUT") {
            return Promise.resolve({});
          } else {
            return Promise.reject(err);
          }
        })
  );

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

  /** Observe Scripts */
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "HEAD") {
            let script;

            /** Get Telegram Script */
            for (const item of node.querySelectorAll("script")) {
              if (item.src === TG_WEB_SCRIPT_SRC) {
                script = item;
                break;
              }
            }

            /** Add Telegram Web */
            if (!script) {
              /** Create Script */
              script = document.createElement("script");
              script.src = TG_WEB_SCRIPT_SRC;

              /** Insert Immediately */
              node.prepend(script);
            }

            /** Override Type */
            script.type = "text/javascript";

            /** Add Load Listener */
            script.addEventListener("load", async (ev) => {
              /** Dispatch App */
              dispatchTelegramWebApp();
            });
          } else if (node.tagName === "BODY") {
            /** Disconnect */
            observer.disconnect();
          }
        });
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
});
