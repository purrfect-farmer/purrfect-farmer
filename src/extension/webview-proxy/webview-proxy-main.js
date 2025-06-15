import { customLogger } from "@/lib/utils";

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
