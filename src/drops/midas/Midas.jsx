import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import MidasAuthDetect from "./components/MidasAuthDetect";
import MidasFarmer from "./components/MidasFarmer";
import useMidasFarmer from "./hooks/useMidasFarmer";

function Midas() {
  const farmer = useMidasFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <MidasFarmer />
      ) : (
        <MidasAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default memo(Midas);
