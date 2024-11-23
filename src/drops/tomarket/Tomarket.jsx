import FarmerContext from "@/contexts/FarmerContext";

import TomarketAuthDetect from "./components/TomarketAuthDetect";
import TomarketFarmer from "./components/TomarketFarmer";
import useTomarket from "./hooks/useTomarket";
import useTomarketFarmer from "./hooks/useTomarketFarmer";

function Tomarket() {
  const farmer = useTomarket(useTomarketFarmer());

  return (
    <div className="flex flex-col min-w-0 min-h-0 grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.tomarket ? (
          <TomarketFarmer />
        ) : (
          <TomarketAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default Tomarket;
