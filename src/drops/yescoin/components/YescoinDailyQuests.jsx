import { memo } from "react";

import YescoinQuests from "./YescoinQuests";

export default memo(function YescoinDailyQuests() {
  return <YescoinQuests category={"daily"} />;
});
