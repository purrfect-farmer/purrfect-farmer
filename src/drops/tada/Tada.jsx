import FarmerContext from "@/contexts/FarmerContext";
import TadaAuthDetect from "./components/TadaAuthDetect";
import TadaFarmer from "./components/TadaFarmer";
import useTadaFarmer from "./hooks/useTadaFarmer";

function Tada() {
  const farmer = useTadaFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? <TadaFarmer /> : <TadaAuthDetect status={farmer.status} />}
    </FarmerContext.Provider>
  );
}

export default Tada;
