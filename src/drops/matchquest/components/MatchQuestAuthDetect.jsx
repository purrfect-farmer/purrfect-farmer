import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import MatchQuestIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function MatchQuestAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"MatchQuest Farmer"}
      icon={MatchQuestIcon}
      status={status}
      className="text-neutral-400"
    />
  );
});
