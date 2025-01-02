import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import RektAuthDetect from "./components/RektAuthDetect";
import RektFarmer from "./components/RektFarmer";
import RektTerms from "./components/RektTerms";
import useRektFarmer from "./hooks/useRektFarmer";

function Rekt() {
  const farmer = useRektFarmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-blue-700 grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <RektTerms>
            <RektFarmer />
          </RektTerms>
        ) : (
          <RektAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default memo(Rekt);
