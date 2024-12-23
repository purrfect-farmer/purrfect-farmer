import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import YescoinAuthDetect from "./components/YescoinAuthDetect";
import YescoinFarmer from "./components/YescoinFarmer";
import useYescoinFarmer from "./hooks/useYescoinFarmer";

function Yescoin() {
  const farmer = useYescoinFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <YescoinFarmer />
      ) : (
        <YescoinAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default memo(Yescoin);
