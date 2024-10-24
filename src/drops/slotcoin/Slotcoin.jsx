import FarmerContext from "@/contexts/FarmerContext";
import SlotcoinAuthDetect from "./components/SlotcoinAuthDetect";
import SlotcoinFarmer from "./components/SlotcoinFarmer";
import useSlotcoinFarmer from "./hooks/useSlotcoinFarmer";

function Slotcoin() {
  const farmer = useSlotcoinFarmer();
  return (
    <FarmerContext.Provider value={farmer}>
      {farmer.auth ? (
        <SlotcoinFarmer />
      ) : (
        <SlotcoinAuthDetect status={farmer.status} />
      )}
    </FarmerContext.Provider>
  );
}

export default Slotcoin;
