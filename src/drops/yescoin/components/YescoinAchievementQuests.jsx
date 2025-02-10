import { memo } from "react";

import YescoinQuests from "./YescoinQuests";

export default memo(function YescoinAchievementQuests() {
  return <YescoinQuests category={"achievement"} />;
});
