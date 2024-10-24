import FarmerContext from "@/contexts/FarmerContext";

import GoatsAuthDetect from "./components/GoatsAuthDetect";
import GoatsFarmer from "./components/GoatsFarmer";
import useGoatsFarmer from "./hooks/useGoatsFarmer";

function Goats() {
  const farmer = useGoatsFarmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-black grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <GoatsFarmer />
        ) : (
          <GoatsAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default Goats;
