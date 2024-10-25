import FarmerContext from "@/contexts/FarmerContext";

import BitsAuthDetect from "./components/BitsAuthDetect";
import BitsFarmer from "./components/BitsFarmer";
import useBitsFarmer from "./hooks/useBitsFarmer";

function Bits() {
  const farmer = useBitsFarmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-black grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <BitsFarmer />
        ) : (
          <BitsAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default Bits;
