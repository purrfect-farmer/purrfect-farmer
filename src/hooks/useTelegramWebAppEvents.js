import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import { customLogger } from "@/lib/utils";
import { useEffect } from "react";
import useApp from "./useApp";

export default function useTelegramWebAppEvents() {
  const app = useApp();
  const { account, settings, openTelegramLink } = app;

  useEffect(() => {
    if (account.active) {
      /**
       * Handles event
       * @param {MessageEvent} ev
       */
      const handler = (ev) => {
        if (
          ev.source !== window &&
          typeof ev.data === "string" &&
          ev.data.includes("eventType")
        ) {
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
              const params = new URL(eventData["path_full"], "https://t.me")
                .searchParams;

              const url = params.get("url");

              const finalUrl = /^(http|https):\/\//.test(url)
                ? url
                : "https://" + url;

              /** Copy URL */
              copy(finalUrl);

              /** Toast */
              toast.success("Copied URL!");

              /** Open Link */
              openTelegramLink(finalUrl);

              break;
          }
        }
      };

      /** Listen for Events */
      window.addEventListener("message", handler, false);

      return () => window.removeEventListener("message", handler, false);
    }
  }, [account.active, openTelegramLink]);
}
