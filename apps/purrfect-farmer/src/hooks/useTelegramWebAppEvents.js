import { handleTelegramWebAppEvent } from "@/lib/telegramWebAppEvents";
import useAppContext from "./useAppContext";
import { useLayoutEffect } from "react";

/** The height the in-app browser reports to its mini-app */
const IN_APP_VIEWPORT_HEIGHT = 600;

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

        console.log("Received Telegram Web App Event:", eventType, eventData);

        /** Handle Event */
        handleTelegramWebAppEvent(eventType, eventData, {
          reply: (type, data) =>
            ev.source.postMessage(
              JSON.stringify({ eventType: type, eventData: data }),
              "*",
            ),
          openLink: (url) => window.open(url),
          openTelegramLink,
          viewportHeight: IN_APP_VIEWPORT_HEIGHT,
        });
      }
    };

    /** Listen for Events */
    window.addEventListener("message", handler);

    return () => window.removeEventListener("message", handler);
  }, [openTelegramLink]);
}
