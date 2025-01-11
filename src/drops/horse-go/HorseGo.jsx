import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import HorseGoAuthDetect from "./components/HorseGoAuthDetect";
import HorseGoFarmer from "./components/HorseGoFarmer";
import useHorseGoFarmer from "./hooks/useHorseGoFarmer";

function HorseGo() {
  const farmer = useHorseGoFarmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-black grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <HorseGoFarmer />
        ) : (
          <HorseGoAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default memo(HorseGo);
