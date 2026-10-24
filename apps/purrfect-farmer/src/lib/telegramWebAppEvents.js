import { customLogger } from "@/utils";

/**
 * Answer a mini-app's Telegram WebView event the way a Telegram client would
 * @param {string} eventType
 * @param {object} eventData
 * @param {object} host
 * @param {(eventType: string, eventData: object) => void} host.reply - send an event back to the mini-app
 * @param {(url: string) => void} host.openLink - open an external link
 * @param {(url: string) => void} host.openTelegramLink - open a t.me link
 * @param {() => void} [host.close] - close the mini-app, ignored when absent
 * @param {number} host.viewportHeight - the height reported to the mini-app
 */
export function handleTelegramWebAppEvent(eventType, eventData, host) {
  switch (eventType) {
    case "web_app_open_popup": {
      const confirmed = window.confirm(eventData.message);
      const buttons = eventData.buttons || [];
      const button_id = confirmed ? buttons[0]?.id : buttons[1]?.id;

      console.log("Popup Response:", { confirmed, button_id });

      host.reply("popup_closed", { button_id });
      break;
    }

    case "web_app_request_viewport":
      host.reply("viewport_changed", {
        height: host.viewportHeight,
        is_state_stable: false,
        is_expanded: true,
      });
      break;

    case "web_app_open_link":
      host.openLink(eventData.url);
      break;

    case "web_app_open_tg_link": {
      const finalUrl = new URL(eventData["path_full"], "https://t.me").href;

      customLogger("TELEGRAM LINK", finalUrl);

      host.openTelegramLink(finalUrl);
      break;
    }

    case "web_app_close":
      host.close?.();
      break;
  }
}
