import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import BirdTonAuthDetect from "./components/BirdTonAuthDetect";
import BirdTonFarmer from "./components/BirdTonFarmer";
import useBirdTon from "./hooks/useBirdTon";
import useBirdTonFarmer from "./hooks/useBirdTonFarmer";

export default memo(function BirdTon() {
  const farmer = useBirdTon(useBirdTonFarmer());

  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-sky-500 grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <BirdTonFarmer />
        ) : (
          <BirdTonAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
});
