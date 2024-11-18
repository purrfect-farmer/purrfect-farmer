import FarmerContext from "@/contexts/FarmerContext";

import MatchQuestAuthDetect from "./components/MatchQuestAuthDetect";
import MatchQuestFarmer from "./components/MatchQuestFarmer";
import useMatchQuestFarmer from "./hooks/useMatchQuestFarmer";

function MatchQuest() {
  const farmer = useMatchQuestFarmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-neutral-800 grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <MatchQuestFarmer />
        ) : (
          <MatchQuestAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default MatchQuest;
