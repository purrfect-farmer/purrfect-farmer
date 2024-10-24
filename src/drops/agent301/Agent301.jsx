import FarmerContext from "@/contexts/FarmerContext";

import Agent301AuthDetect from "./components/Agent301AuthDetect";
import Agent301Farmer from "./components/Agent301Farmer";
import useAgent301Farmer from "./hooks/useAgent301Farmer";

function Agent301() {
  const farmer = useAgent301Farmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-white bg-black grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <Agent301Farmer />
        ) : (
          <Agent301AuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
}

export default Agent301;
