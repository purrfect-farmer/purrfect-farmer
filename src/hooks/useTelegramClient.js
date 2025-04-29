import { Api } from "telegram";
import { NewMessage, Raw } from "telegram/events";
import { UpdateConnectionState } from "telegram/network";
import { createTelegramClient } from "@/lib/createTelegramClient";
import {
  customLogger,
  extractTgWebAppData,
  isTelegramLink,
  parseTelegramLink,
} from "@/lib/utils";
import { useCallback, useLayoutEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useTelegramClient(mode, session) {
  const ref = useRef(null);
  const hasSession = Boolean(session);
  const [connected, setConnected] = useState(false);

  const execute = useCallback(async (callback) => {
    if (ref.current === null) {
      throw new Error("No Telegram Client!");
    }

    /** Connect  */
    await ref.current.connect();

    /** Ensure User is Authorized  */
    if (await ref.current.isUserAuthorized()) {
      return callback(ref.current);
    }
  }, []);

  /** Wait for Reply */
  const waitForReply = useCallback(
    /**
     * @param {import("telegram").TelegramClient} client
     */
    (client, entity, { filter } = {}) =>
      new Promise((resolve) => {
        /** Event to Handle */
        const eventToHandle = new NewMessage({
          fromUsers: [entity],
        });

        /**
         * @param {import("telegram/events").NewMessageEvent} event
         */
        const handler = (event) => {
          customLogger("BOT RECEIVED MESSAGE", event);

          if (typeof filter === "undefined" || filter(event.message)) {
            client.removeEventHandler(handler, eventToHandle);
            resolve(event.message);
          }
        };

        /** Add Event */
        client.addEventHandler(handler, eventToHandle);
      }),
    []
  );

  /** Base Start Bot */
  const baseStartBot = useCallback(
    /**
     * @param {import("telegram").TelegramClient} client
     */
    async (
      client,
      { entity, startParam = "", shouldWaitForReply = true } = {},
      replyOptions
    ) => {
      /** Start the Bot */
      const result = await client.invoke(
        new Api.messages.StartBot({
          bot: entity,
          peer: entity,
          startParam: startParam,
        })
      );

      /** Log Bot Start */
      customLogger("START BOT", result);

      /** Wait for Reply */
      if (shouldWaitForReply) {
        return waitForReply(client, entity, replyOptions);
      }
    },
    [waitForReply]
  );

  /** Start Bot */
  const startBot = useCallback(
    (startOptions, replyOptions) =>
      execute(
        /**
         * @param {import("telegram").TelegramClient} client
         */
        (client) => baseStartBot(client, startOptions, replyOptions)
      ),
    [execute, baseStartBot]
  );

  /** Start Bot from Link */
  const startBotFromLink = useCallback(
    (link, startOptions, replyOptions) =>
      execute(
        /**
         * @param {import("telegram").TelegramClient} client
         */
        (client) => {
          const { entity, startParam } = parseTelegramLink(link);
          return baseStartBot(
            client,
            {
              ...startOptions,
              entity,
              startParam,
            },
            replyOptions
          );
        }
      ),
    [execute, baseStartBot]
  );

  /** Get Entity */
  const getEntity = useCallback(
    (link) =>
      execute(
        /**
         * @param {import("telegram").TelegramClient} client
         */
        async (client) => {
          const parsed = parseTelegramLink(link);
          const entity = await client.getEntity(parsed.entity);
          const buffer = await client.downloadProfilePhoto(entity, {
            isBig: false,
          });
          const result = {
            entity,
            profilePhoto: `data:image/jpeg;base64,${buffer.toString("base64")}`,
          };

          /** Entity */
          customLogger("ENTITY", {
            link,
            result,
          });

          return result;
        }
      ),
    [execute]
  );

  /** Get Webview */
  const getWebview = useCallback(
    (link) =>
      execute(
        /**
         * @param {import("telegram").TelegramClient} client
         */
        async (client) => {
          let parsed = parseTelegramLink(link);
          let url;
          const themeParams = new Api.DataJSON({
            data: JSON.stringify({
              bg_color: "#ffffff",
              text_color: "#000000",
              hint_color: "#aaaaaa",
              link_color: "#006aff",
              button_color: "#2cab37",
              button_text_color: "#ffffff",
            }),
          });

          /** Start the Bot */
          if (!parsed.shortName) {
            await baseStartBot(
              client,
              {
                entity: parsed.entity,
                startParam: parsed.startParam,
              },
              {
                filter(message) {
                  const buttons = message
                    ? message.buttons
                        .flat()
                        .map((item) => item.button)
                        .filter((button) => Boolean(button.url))
                    : null;

                  if (buttons) {
                    for (const button of buttons) {
                      if (isTelegramLink(button.url) === false) {
                        url = button.url;
                        return true;
                      } else {
                        const parsedTelegramLink = parseTelegramLink(
                          button.url
                        );

                        if (
                          parsed.entity.toLowerCase() ===
                            parsedTelegramLink.entity.toLowerCase() &&
                          parsedTelegramLink.shortName
                        ) {
                          parsed.shortName = parsedTelegramLink.shortName;
                          return true;
                        }
                      }
                    }
                  }
                },
              }
            );
          }

          const result = await client.invoke(
            url
              ? new Api.messages.RequestWebView({
                  url,
                  platform: "android",
                  bot: parsed.entity,
                  peer: parsed.entity,
                  startParam: parsed.startParam,
                  themeParams,
                })
              : new Api.messages.RequestAppWebView({
                  platform: "android",
                  peer: parsed.entity,
                  startParam: parsed.startParam,
                  app: new Api.InputBotAppShortName({
                    botId: await client.getInputEntity(parsed.entity),
                    shortName: parsed.shortName,
                  }),
                  themeParams,
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
    [execute, baseStartBot]
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

      /** Set Connection State */
      setConnected(client.connected);

      /** Add Connected Event Handler */
      client.addEventHandler(
        (event) => {
          setConnected(event.state === UpdateConnectionState.connected);
        },
        new Raw({
          types: [UpdateConnectionState],
        })
      );

      /** Connect */
      client.connect();

      return () => {
        client?.destroy();
        ref.current = null;
        setConnected(false);
      };
    }
  }, [session, mode, setConnected]);

  return useValuesMemo({
    ref,
    hasSession,
    connected,
    execute,
    waitForReply,
    startBot,
    startBotFromLink,
    getEntity,
    getWebview,
    getTelegramWebApp,
    joinTelegramLink,
  });
}
