import FarmerContext from "@/contexts/FarmerContext";

import TomarketAuthDetect from "./components/TomarketAuthDetect";
import TomarketFarmer from "./components/TomarketFarmer";
import useTomarketFarmer from "./hooks/useTomarketFarmer";

function Tomarket() {
  const farmer = useTomarketFarmer();

  return (
    <div className="flex flex-col min-w-0 min-h-0 grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <TomarketFarmer />
        ) : (
          <TomarketAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default Tomarket;
