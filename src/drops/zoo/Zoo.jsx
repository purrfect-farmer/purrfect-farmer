import FarmerContext from "@/contexts/FarmerContext";

import ZooAuthDetect from "./components/ZooAuthDetect";
import ZooFarmer from "./components/ZooFarmer";
import useZooFarmer from "./hooks/useZooFarmer";

function Zoo() {
  const farmer = useZooFarmer();

  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-lime-600 grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? <ZooFarmer /> : <ZooAuthDetect status={farmer.status} />}
      </FarmerContext.Provider>
    </div>
  );
}

export default Zoo;
