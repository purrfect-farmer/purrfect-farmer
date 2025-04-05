import { memo } from "react";

import Browser from "./Browser";

export default memo(function TelegramWeb({ version, hash = "" }) {
  return <Browser url={`https://web.telegram.org/${version}${hash}`} />;
});
