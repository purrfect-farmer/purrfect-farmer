import { Api } from "telegram";
import { NewMessage } from "telegram/events";
import { createTelegramClient } from "@/lib/createTelegramClient";
import {
  customLogger,
  extractTgWebAppData,
  parseTelegramLink,
} from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";

export default function useTelegramClient(mode, session) {
  const ref = useRef(null);

  const execute = useCallback(async (callback) => {
    if (!ref.current.connected) {
      await ref.current.connect();
    }

    return await callback(ref.current);
  }, []);

  /** Get Webview */
  const getWebview = useCallback(
    (link) =>
      execute(
        /**
         * @param {import("telegram").TelegramClient} client
         */
        async (client) => {
          const parsed = parseTelegramLink(link);

          /** Start the Bot */
          if (!parsed.shortName) {
            const result = await client.invoke(
              new Api.messages.StartBot({
                bot: parsed.bot,
                peer: parsed.bot,
                startParam: parsed.startParam,
              })
            );

            /** Log Bot Start */
            customLogger("START BOT", result);

            await new Promise((resolve) => {
              /** Event to Handle */
              const eventToHandle = new NewMessage({ fromUsers: [parsed.bot] });

              /**
               * @param {import("telegram/events").NewMessageEvent} event
               */
              const handler = (event) => {
                client.removeEventHandler(handler, eventToHandle);
                customLogger("BOT RECEIVED MESSAGE", event);
                resolve();
              };

              /** Add Event */
              client.addEventHandler(handler, eventToHandle);
            });
          }

          const result = await client.invoke(
            parsed.shortName
              ? new Api.messages.RequestAppWebView({
                  platform: "android",
                  peer: parsed.bot,
                  startParam: parsed.startParam,
                  app: new Api.InputBotAppShortName({
                    botId: await client.getInputEntity(parsed.bot),
                    shortName: parsed.shortName,
                  }),
                })
              : new Api.messages.RequestMainWebView({
                  platform: "android",
                  bot: parsed.bot,
                  peer: parsed.bot,
                  startParam: parsed.startParam,
                })
          );

          /** Webview */
          customLogger("WEBVIEW", {
            link,
            result,
          });

          return result;
        }
      ),
    [execute]
  );

  /** Get Telegram WebApp */
  const getTelegramWebApp = useCallback(
    async (link) => {
      const webview = await getWebview(link);
      const result = extractTgWebAppData(webview.url);

      /** Log */
      customLogger("TELEGRAM WEB APP", {
        link,
        result,
      });

      return result;
    },
    [getWebview]
  );

  useEffect(() => {
    if (mode === "session" && session) {
      /** Log Session */
      customLogger("TG CLIENT SESSION", session);

      /** Create Client */
      const client = ref.current || createTelegramClient(session);

      /** Set Ref */
      ref.current = client;

      /** Connect */
      if (!client.connected) {
        client.connect();
      }

      return () => {
        client.destroy();
        ref.current = null;
      };
    }
  }, [session, mode]);

  return useMemo(
    () => ({ ref, getWebview, getTelegramWebApp }),
    [ref, getWebview, getTelegramWebApp]
  );
}
