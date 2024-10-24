import FarmerContext from "@/contexts/FarmerContext";
import MajorAuthDetect from "./components/MajorAuthDetect";
import MajorFarmer from "./components/MajorFarmer";
import useMajorFarmer from "./hooks/useMajorFarmer";

function Major() {
  const farmer = useMajorFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <MajorFarmer />
      ) : (
        <MajorAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default Major;
