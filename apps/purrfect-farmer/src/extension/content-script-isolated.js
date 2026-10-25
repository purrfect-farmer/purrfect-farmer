import "./bridge/bridge-isolated";
import "./telegram-web/telegram-web-isolated";

import {
  createListener,
  USER_AGENT_STORAGE_KEY,
  customLogger,
  matchTelegramWebUrl,
  readUserAgent,
  uuid,
} from "@/utils";
import {
  decryptData,
  encryptData,
  watchTelegramMiniApp,
} from "./content-script-utils";

import { WEB_PLATFORM_EXCLUDED_HOSTS } from "@/constants";
import { rememberMiniAppHost } from "@/lib/miniAppHosts";
import storage from "@/lib/storage";
import { setupMiniAppToolbar } from "./mini-app/mini-app-toolbar-isolated";

/** How long the farmer has to take a t.me link before it opens in a new tab */
const FARMER_REPLY_TIMEOUT = 1000;

if (!matchTelegramWebUrl()) {
  /** Initial Location Href */
  const INITIAL_LOCATION = location.href;

  /** Post window message */
  const postWindowMessage = (data) => {
    return new Promise((resolve) => {
      /** Generate ID */
      const id = data.id || uuid();

      window.addEventListener(
        "message",
        createListener((listener, ev) => {
          try {
            if (
              ev.source === window &&
              ev.data?.id === id &&
              ev.data?.type === "response"
            ) {
              window.removeEventListener("message", listener);
              resolve(decryptData(ev.data.payload));
            }
          } catch (e) {
            console.error(e);
          }
        }),
      );
      window.postMessage(
        {
          id,
          type: "request",
          payload: encryptData(data),
        },
        "*",
      );
    });
  };

  /** Open Telegram Link */
  async function openTelegramLink({ id, url }) {
    return await postWindowMessage({
      id,
      action: "open-telegram-link",
      data: {
        url,
      },
    });
  }

  /** Show the page the stored User-Agent, leaving the browser's own until the farmer stores one */
  async function updateUserAgent() {
    const userAgent = await readUserAgent();

    if (!userAgent) return;

    return await postWindowMessage({
      action: "set-user-agent",
      data: {
        userAgent,
      },
    });
  }

  /** Get Telegram WebApp */
  async function getTelegramWebApp() {
    return await postWindowMessage({
      action: "get-telegram-web-app",
    });
  }

  /** Close Bot */
  async function closeBot({ id }) {
    return await postWindowMessage({
      id,
      action: "close-bot",
    });
  }

  /** Initialize */
  function initialize() {
    customLogger("Initializing Telegram Mini-App Integration...");

    /** Connect to Messaging */
    const port = chrome.runtime.connect(chrome.runtime.id, {
      name: `mini-app:${location.host}`,
    });

    /** Dispatch TelegramWebApp */
    const dispatchTelegramWebApp = async (data) => {
      try {
        port.postMessage({
          action: `set-telegram-web-app:${location.host}`,
          data: {
            host: location.host,
            telegramWebApp: {
              ...data,
              initLocationHref: INITIAL_LOCATION,
            },
          },
        });
      } catch (e) {
        console.error(e);
      }
    };

    /** Listen for TelegramWebApp */
    const listenForTelegramWeb = (ev) => {
      if (ev.source === window && ev.data?.type === "init") {
        window.removeEventListener("message", listenForTelegramWeb);

        const telegramWebApp = decryptData(ev.data?.payload);

        customLogger(`TELEGRAM WEB APP: ${location.host}`, telegramWebApp);
        dispatchTelegramWebApp(telegramWebApp);
      }
    };

    /** Open a t.me link in the farmer, or in a new tab when no farmer answers */
    const openTelegramLinkInFarmer = (url) => {
      const id = uuid();
      const openInTab = () => window.open(url);

      const listener = (message) => {
        if (message?.id === id && message?.type === "response") {
          clearTimeout(fallback);
          port.onMessage.removeListener(listener);
        }
      };

      const fallback = setTimeout(() => {
        port.onMessage.removeListener(listener);
        openInTab();
      }, FARMER_REPLY_TIMEOUT);

      port.onMessage.addListener(listener);

      try {
        port.postMessage({
          id,
          action: "farmer:open-telegram-link",
          data: { url },
        });
      } catch {
        /** The farmer is not open, so the port is already closed */
        clearTimeout(fallback);
        port.onMessage.removeListener(listener);
        openInTab();
      }
    };

    /** Handle requests from the mini-app's own page script */
    const listenForPageRequests = (ev) => {
      if (ev.source !== window || ev.data?.type !== "main-request") return;

      try {
        const { action, data } = decryptData(ev.data.payload);

        if (action === "open-telegram-link") {
          openTelegramLinkInFarmer(data.url);
        }
      } catch (e) {
        console.error(e);
      }
    };

    /** Handle Port Messages */
    port.onMessage?.addListener(async (message) => {
      const { id, action, data } = message;
      const reply = (data) => {
        port.postMessage({
          id,
          data,
          type: "response",
        });
      };

      switch (action) {
        case `get-telegram-web-app:${location.host}`:
          const telegramWebApp = await getTelegramWebApp();
          dispatchTelegramWebApp(telegramWebApp);
          break;

        case "open-telegram-link":
          await openTelegramLink({ id, ...data });
          try {
            reply(true);
          } catch (e) {
            console.error(e);
          }
          break;

        case "close-bot":
          await closeBot({ id });
          try {
            reply(true);
          } catch (e) {
            console.error(e);
          }
          break;
      }
    });

    /** Listen for TelegramWebApp */
    window.addEventListener("message", listenForTelegramWeb);

    /** Listen for the page's requests */
    window.addEventListener("message", listenForPageRequests);

    /** Update User-Agent, and again whenever the farmer changes it */
    updateUserAgent();
    storage.watch(USER_AGENT_STORAGE_KEY, updateUserAgent);

    /** Give this host the phone's headers from now on */
    if (!WEB_PLATFORM_EXCLUDED_HOSTS.includes(location.host)) {
      rememberMiniAppHost(location.hostname);
    }

    /** Setup Mini-App Toolbar */
    setupMiniAppToolbar();
  }

  /** Watch Mini-App */
  watchTelegramMiniApp(initialize);
}
