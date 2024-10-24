import FarmerContext from "@/contexts/FarmerContext";
import FullSpinner from "@/components/FullSpinner";

import TruecoinAuthDetect from "./components/TruecoinAuthDetect";
import TruecoinFarmer from "./components/TruecoinFarmer";
import useTruecoinFarmer from "./hooks/useTruecoinFarmer";

function Truecoin() {
  const farmer = useTruecoinFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.userRequest.data ? (
        <TruecoinFarmer />
      ) : farmer.auth ? (
        <FullSpinner />
      ) : (
        <TruecoinAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default Truecoin;
