import { customLogger } from "@/lib/utils";
import { useLayoutEffect } from "react";

import useAppContext from "./useAppContext";

export default function useTelegramWebAppEvents(ref) {
  const app = useAppContext();

  /** Open Telegram Link */
  const { openTelegramLink } = app;

  useLayoutEffect(() => {
    /**
     * Handles event
     * @param {MessageEvent} ev
     */
    const handler = (ev) => {
      if (ref.current && ev.source === ref.current.contentWindow) {
        if (typeof ev.data === "string" && ev.data.includes("eventType")) {
          /** Parse Event */
          const event = JSON.parse(ev.data);

          /** Log Event */
          customLogger("TELEGRAM WEB APP EVENT", event);

          /** Destructure Event */
          const { eventType, eventData } = event;

          /** Handle Event */
          switch (eventType) {
            case "web_app_open_link":
              window.open(eventData.url);
              break;
            case "web_app_open_tg_link":
              const finalUrl = new URL(eventData["path_full"], "https://t.me")
                .href;

              customLogger("TELEGRAM LINK", finalUrl);

              /** Open Link */
              openTelegramLink(finalUrl, { force: true });
              break;
          }
        }
      }
    };

    /** Listen for Events */
    window.addEventListener("message", handler);

    return () => window.removeEventListener("message", handler);
  }, [openTelegramLink]);
}
