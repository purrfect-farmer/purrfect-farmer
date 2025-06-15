import { customLogger, withValue } from "@/lib/utils";

/** Custom Message Event */
class CustomMessageEvent extends MessageEvent {
  constructor(type, options) {
    /** Log */
    customLogger("MESSAGE EVENT", type, options);

    const safeOptions = { ...options };

    if (options?.source && !(options.source instanceof Window)) {
      safeOptions.source = window;
    }

    super(type, safeOptions);
    this._originalOptions = options;
  }

  get source() {
    return this._originalOptions?.source || window;
  }
}

/** Cross Origin */
if (window.self !== window.top) {
  /** Custom Message Event */
  window.MessageEvent = CustomMessageEvent;

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
}

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

  /** Stop Propagation */
  ev.stopImmediatePropagation();

  /** Receive Event */
  window.Telegram?.WebView?.receiveEvent?.(eventType, eventData);
});

/** Mimic Telegram Webview Proxy */
window.TelegramWebviewProxy = {
  postEvent(type, data) {
    const eventType = type;
    const eventData = typeof data !== "undefined" ? JSON.parse(data) : data;

    customLogger("TELEGRAM WEBVIEW PROXY", eventType, eventData);

    return window.parent.postMessage(
      JSON.stringify({
        eventType,
        eventData,
      }),
      "*"
    );
  },
};
