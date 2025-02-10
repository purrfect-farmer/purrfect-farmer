import { memo } from "react";

import YescoinQuests from "./YescoinQuests";

export default memo(function YescoinPartnerQuests() {
  return <YescoinQuests category={"partner"} />;
});
