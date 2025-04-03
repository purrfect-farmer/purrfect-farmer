import { Api } from "telegram";
import { NewMessage } from "telegram/events";
import { createTelegramClient } from "@/lib/createTelegramClient";
import {
  customLogger,
  extractTgWebAppData,
  parseTelegramLink,
} from "@/lib/utils";
import { useCallback, useLayoutEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";

export default function useTelegramClient(mode, session) {
  const ref = useRef(null);
  const hasSession = Boolean(session);

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
                bot: parsed.entity,
                peer: parsed.entity,
                startParam: parsed.startParam,
              })
            );

            /** Log Bot Start */
            customLogger("START BOT", result);

            await new Promise((resolve) => {
              /** Event to Handle */
              const eventToHandle = new NewMessage({
                fromUsers: [parsed.entity],
              });

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
                  peer: parsed.entity,
                  startParam: parsed.startParam,
                  app: new Api.InputBotAppShortName({
                    botId: await client.getInputEntity(parsed.entity),
                    shortName: parsed.shortName,
                  }),
                })
              : new Api.messages.RequestMainWebView({
                  platform: "android",
                  bot: parsed.entity,
                  peer: parsed.entity,
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

  /** Join Telegram Link */
  const joinTelegramLink = useCallback(
    (link) =>
      execute(
        /**
         * @param {import("telegram").TelegramClient} client
         */
        async (client) => {
          try {
            const parsed = parseTelegramLink(link);
            const result = await client.invoke(
              parsed.entity.startsWith("+")
                ? new Api.messages.ImportChatInvite({
                    hash: parsed.entity.replace("+", ""),
                  })
                : new Api.channels.JoinChannel({
                    channel: parsed.entity,
                  })
            );

            /** Log */
            customLogger("JOINED CHANNEL", {
              link,
              result,
            });

            /** Return Result */
            return result;
          } catch (error) {
            if (
              error.message.includes("USER_ALREADY_PARTICIPANT") === false &&
              error.message.includes("INVITE_REQUEST_SENT") === false
            ) {
              throw error;
            }
          }
        }
      ),
    [execute]
  );

  useLayoutEffect(() => {
    if (mode === "session" && session) {
      /** Log Session */
      customLogger("TG CLIENT SESSION", session);

      /** @type {import("telegram").TelegramClient} Client */
      const client = ref.current || createTelegramClient(session);

      /** Set Ref */
      ref.current = client;

      if (client) {
        /** Connect */
        if (!client.connected) {
          client.connect();
        }
      }

      return () => {
        client?.destroy();
        ref.current = null;
      };
    }
  }, [session, mode]);

  return useMemo(
    () => ({
      ref,
      hasSession,
      getWebview,
      getTelegramWebApp,
      joinTelegramLink,
    }),
    [ref, hasSession, getWebview, getTelegramWebApp, joinTelegramLink]
  );
}
