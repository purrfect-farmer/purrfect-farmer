import useAccountContext from "@/hooks/useAccountContext";
import { memo } from "react";

import Browser from "./Browser";

export default memo(function TelegramWeb({ version, hash = "" }) {
  const account = useAccountContext();
  return (
    <Browser
      url={`https://web.telegram.org/${version}?account=${
        account.index + 1
      }${hash}`}
    />
  );
});
