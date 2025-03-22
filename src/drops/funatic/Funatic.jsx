import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";
import FunaticAuthDetect from "./components/FunaticAuthDetect";
import FunaticFarmer from "./components/FunaticFarmer";
import useFunaticFarmer from "./hooks/useFunaticFarmer";

function Funatic() {
  const farmer = useFunaticFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <FunaticFarmer />
      ) : (
        <FunaticAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default memo(Funatic);
