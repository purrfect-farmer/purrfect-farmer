import { memo } from "react";

import Browser from "./Browser";
import useAppContext from "@/hooks/useAppContext";

export default memo(function TelegramWeb({ version, tgaddr }) {
  const { account, sharedSettings } = useAppContext();
  const search = new URLSearchParams({ account: account.index + 1 }).toString();
  const hash = new URLSearchParams({ tgaddr }).toString();
  const client = sharedSettings.telegramClient || "purrfect-gram";
  const origin =
    client === "telegram-web"
      ? "https://web.telegram.org"
      : "https://gram.purrfectfarmer.com";

  return <Browser url={`${origin}/${version}?${search}#?${hash}`} />;
});
