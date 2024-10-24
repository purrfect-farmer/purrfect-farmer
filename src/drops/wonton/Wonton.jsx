import FarmerContext from "@/contexts/FarmerContext";
import WontonAuthDetect from "./components/WontonAuthDetect";
import WontonFarmer from "./components/WontonFarmer";
import useWontonFarmer from "./hooks/useWontonFarmer";

function Wonton() {
  const farmer = useWontonFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <WontonFarmer />
      ) : (
        <WontonAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default Wonton;
