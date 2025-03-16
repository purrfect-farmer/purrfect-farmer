import Farmer from "@/components/Farmer";
import { memo } from "react";

import MatchQuestFarmer from "./components/MatchQuestFarmer";
import useMatchQuestFarmer from "./hooks/useMatchQuestFarmer";

function MatchQuest() {
  const farmer = useMatchQuestFarmer();
  return (
    <Farmer
      farmer={farmer}
      className="text-white bg-neutral-800"
      initClassName="text-neutral-400"
    >
      <MatchQuestFarmer />
    </Farmer>
  );
}

export default memo(MatchQuest);
