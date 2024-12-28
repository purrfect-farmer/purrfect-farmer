import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";
import BattleBullsAuthDetect from "./components/BattleBullsAuthDetect";
import BattleBullsFarmer from "./components/BattleBullsFarmer";
import useBattleBullsFarmer from "./hooks/useBattleBullsFarmer";

function BattleBulls() {
  const farmer = useBattleBullsFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <BattleBullsFarmer />
      ) : (
        <BattleBullsAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default memo(BattleBulls);
