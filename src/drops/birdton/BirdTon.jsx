import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import BirdTonAuthDetect from "./components/BirdTonAuthDetect";
import BirdTonFarmer from "./components/BirdTonFarmer";
import useBirdTon from "./hooks/useBirdTon";
import useBirdTonFarmer from "./hooks/useBirdTonFarmer";

export default memo(function BirdTon() {
  const farmer = useBirdTon(useBirdTonFarmer());

  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <BirdTonFarmer />
      ) : (
        <BirdTonAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
});
