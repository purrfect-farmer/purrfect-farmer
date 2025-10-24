import useAccountContext from "@/hooks/useAccountContext";
import { memo } from "react";

import Browser from "./Browser";

export default memo(function TelegramWeb({ version, tgaddr }) {
  const account = useAccountContext();
  const search = new URLSearchParams({ account: account.index + 1 }).toString();
  const hash = new URLSearchParams({ tgaddr }).toString();

  return (
    <Browser
      url={`https://gram.purrfectfarmer.com/${version}?${search}#?${hash}`}
    />
  );
});
