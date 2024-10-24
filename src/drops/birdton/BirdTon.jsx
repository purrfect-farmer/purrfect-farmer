import FarmerContext from "@/contexts/FarmerContext";
import FullSpinner from "@/components/FullSpinner";

import BirdTonAuthDetect from "./components/BirdTonAuthDetect";
import BirdTonFarmer from "./components/BirdTonFarmer";
import useBirdTon from "./hooks/useBirdTon";
import useBirdTonFarmer from "./hooks/useBirdTonFarmer";

export default function BirdTon() {
  const farmer = useBirdTon(useBirdTonFarmer());

  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.userRequest.data ? (
        <BirdTonFarmer />
      ) : farmer.auth ? (
        <FullSpinner />
      ) : (
        <BirdTonAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}
