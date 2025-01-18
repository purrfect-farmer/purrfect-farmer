import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import GoldEagleAuthDetect from "./components/GoldEagleAuthDetect";
import GoldEagleFarmer from "./components/GoldEagleFarmer";
import useGoldEagle from "./hooks/useGoldEagle";
import useGoldEagleFarmer from "./hooks/useGoldEagleFarmer";

function GoldEagle() {
  const farmer = useGoldEagle(useGoldEagleFarmer());
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.game ? (
        <GoldEagleFarmer />
      ) : (
        <GoldEagleAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default memo(GoldEagle);
