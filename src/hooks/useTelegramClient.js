import { Api } from "telegram";
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
      execute(async (client) => {
        const parsed = parseTelegramLink(link);
        return await client.invoke(
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
      }),
    [execute]
  );

  /** Get Telegram WebApp */
  const getTelegramWebApp = useCallback(
    async (link) => {
      const webview = await getWebview(link);
      return extractTgWebAppData(webview.url);
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
