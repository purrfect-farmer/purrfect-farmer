import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";
import CEXAuthDetect from "./components/CEXAuthDetect";
import CEXFarmer from "./components/CEXFarmer";
import useCEXFarmer from "./hooks/useCEXFarmer";

function CEX() {
  const farmer = useCEXFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? <CEXFarmer /> : <CEXAuthDetect status={farmer.status} />}
    </FarmerContext.Provider>
  );
}

export default memo(CEX);
