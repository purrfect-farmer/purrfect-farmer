import FarmerContext from "@/contexts/FarmerContext";
import PumpadAuthDetect from "./components/PumpadAuthDetect";
import PumpadFarmer from "./components/PumpadFarmer";
import usePumpadFarmer from "./hooks/usePumpadFarmer";

function Pumpad() {
  const farmer = usePumpadFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <PumpadFarmer />
      ) : (
        <PumpadAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default Pumpad;
