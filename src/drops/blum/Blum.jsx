import FarmerContext from "@/contexts/FarmerContext";

import BlumAuthDetect from "./components/BlumAuthDetect";
import BlumFarmer from "./components/BlumFarmer";
import useBlumFarmer from "./hooks/useBlumFarmer";

function Blum() {
  const farmer = useBlumFarmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-black grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <BlumFarmer />
        ) : (
          <BlumAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default Blum;
