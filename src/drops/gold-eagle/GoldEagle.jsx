import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import GoldEagleAuthDetect from "./components/GoldEagleAuthDetect";
import GoldEagleFarmer from "./components/GoldEagleFarmer";
import useGoldEagleFarmer from "./hooks/useGoldEagleFarmer";

function GoldEagle() {
  const farmer = useGoldEagleFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <GoldEagleFarmer />
      ) : (
        <GoldEagleAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default memo(GoldEagle);
