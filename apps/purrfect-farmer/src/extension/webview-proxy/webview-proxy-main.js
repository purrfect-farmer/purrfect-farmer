import { customLogger, withValue } from "@/utils";
import { encryptData } from "../content-script-utils";
import { handleTelegramWebAppEvent } from "@/lib/telegramWebAppEvents";

export function overrideMessageEvent() {
  const NativeMessageEvent = MessageEvent;

  /** Custom Message Event */
  class CustomMessageEvent extends NativeMessageEvent {
    constructor(type, options) {
      const safeOptions = { ...options };

      if (options?.source && !(options.source instanceof EventTarget)) {
        safeOptions.source = window;
      }

      super(type, safeOptions);
      this._originalOptions = options;
    }

    get source() {
      return this._originalOptions?.source || window;
    }
  }

  /** Custom Message Event */
  window.MessageEvent = CustomMessageEvent;

  /** Capture Message */
  window.addEventListener("message", (ev) => {
    if (ev instanceof CustomMessageEvent || typeof ev.data !== "string") return;

    let event;
    try {
      event = JSON.parse(ev.data);
    } catch (e) {
      return;
    }

    const { eventType, eventData } = event || {};
    if (!eventType) return;

    /** Stop Immediate Propagation */
    ev.stopImmediatePropagation();

    /** Receive Event */
    window.Telegram?.WebView?.receiveEvent?.(eventType, eventData);
  });
}

/** Ask the isolated script to open a t.me link, which it routes to the farmer */
const requestTelegramLink = (url) =>
  window.postMessage(
    {
      type: "main-request",
      payload: encryptData({ action: "open-telegram-link", data: { url } }),
    },
    "*",
  );

/** Answer an event of a mini-app opened in its own tab, where no host is listening */
const answerStandaloneEvent = (eventType, eventData) =>
  handleTelegramWebAppEvent(eventType, eventData, {
    /** A real client answers asynchronously */
    reply: (type, data) =>
      setTimeout(() => window.Telegram?.WebView?.receiveEvent?.(type, data)),
    openLink: (url) => window.open(url),
    openTelegramLink: requestTelegramLink,
    close: () => window.close(),
    viewportHeight: window.innerHeight,
  });

export function injectTelegramWebviewProxy() {
  /** A mini-app in its own tab has no parent to answer it */
  const isStandalone = window.self === window.top;

  /** Mimic Telegram Webview Proxy */
  window.TelegramWebviewProxy = {
    postEvent(type, data) {
      const eventType = type;
      const eventData = typeof data !== "undefined" ? JSON.parse(data) : data;

      customLogger("TELEGRAM WEBVIEW PROXY", eventType, eventData);

      if (isStandalone) {
        return answerStandaloneEvent(eventType, eventData);
      }

      return window.parent.postMessage(
        JSON.stringify({
          eventType,
          eventData,
        }),
        "*",
      );
    },
  };

  /** Cross Origin */
  if (window.self !== window.top) {
    /** Override Window Parent */
    window.parent = withValue(window.parent, (parent) => {
      return {
        postMessage(...args) {
          /** Log */
          customLogger("PARENT POST-MESSAGE", args);

          if (typeof args[1] === "object") {
            return parent.postMessage(args[0], {
              ...args[1],
              targetOrigin: "*",
            });
          } else {
            return parent.postMessage(args[0], "*", args[2]);
          }
        },
      };
    });

    /** Capture Message */
    window.addEventListener("message", (ev) => {
      if (ev.origin === "https://web.telegram.org") return;
      if (typeof ev.data !== "string") return;

      let event;
      try {
        event = JSON.parse(ev.data);
      } catch (e) {
        return;
      }

      const { eventType, eventData } = event || {};
      if (!eventType) return;

      /** Stop Immediate Propagation */
      ev.stopImmediatePropagation();

      /** Receive Event */
      window.Telegram?.WebView?.receiveEvent?.(eventType, eventData);
    });
  }
}
