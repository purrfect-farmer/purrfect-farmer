import FarmerContext from "@/contexts/FarmerContext";

import DreamCoinAuthDetect from "./components/DreamCoinAuthDetect";
import DreamCoinFarmer from "./components/DreamCoinFarmer";
import useDreamCoinFarmer from "./hooks/useDreamCoinFarmer";

function DreamCoin() {
  const farmer = useDreamCoinFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <DreamCoinFarmer />
      ) : (
        <DreamCoinAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default DreamCoin;
