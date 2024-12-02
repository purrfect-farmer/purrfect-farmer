import FarmerContext from "@/contexts/FarmerContext";

import TsubasaAuthDetect from "./components/TsubasaAuthDetect";
import TsubasaFarmer from "./components/TsubasaFarmer";
import useTsubasa from "./hooks/useTsubasa";
import useTsubasaFarmer from "./hooks/useTsubasaFarmer";

function Tsubasa() {
  const farmer = useTsubasa(useTsubasaFarmer());
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <TsubasaFarmer />
      ) : (
        <TsubasaAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default Tsubasa;
