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
        /** Stop Immediate Propagation */
        ev.stopImmediatePropagation();

        if (typeof ev.data !== "string") return;

        let event;
        try {
          event = JSON.parse(ev.data);
        } catch (e) {
          return;
        }

        const { eventType, eventData } = event || {};
        if (!eventType) return;

        /** Handle Event */
        switch (eventType) {
          case "web_app_request_viewport":
            ev.source.postMessage(
              JSON.stringify({
                eventType: "viewport_changed",
                eventData: {
                  height: 600,
                  is_state_stable: false,
                  is_expanded: true,
                },
              }),
              "*"
            );
            break;

          case "web_app_open_link":
            window.open(eventData.url);
            break;
          case "web_app_open_tg_link":
            const finalUrl = new URL(eventData["path_full"], "https://t.me")
              .href;

            customLogger("TELEGRAM LINK", finalUrl);

            /** Open Link */
            openTelegramLink(finalUrl);
            break;
        }
      }
    };

    /** Listen for Events */
    window.addEventListener("message", handler);

    return () => window.removeEventListener("message", handler);
  }, [openTelegramLink]);
}
