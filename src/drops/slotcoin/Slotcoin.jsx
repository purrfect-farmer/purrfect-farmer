import Farmer from "@/components/Farmer";
import { memo } from "react";

import SlotcoinFarmer from "./components/SlotcoinFarmer";
import useSlotcoinFarmer from "./hooks/useSlotcoinFarmer";

function Slotcoin() {
  const farmer = useSlotcoinFarmer();
  return (
    <Farmer farmer={farmer}>
      <SlotcoinFarmer />
    </Farmer>
  );
}

export default memo(Slotcoin);
