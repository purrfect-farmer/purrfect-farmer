import Farmer from "@/components/Farmer";
import { memo } from "react";

import DreamCoinFarmer from "./components/DreamCoinFarmer";
import useDreamCoinFarmer from "./hooks/useDreamCoinFarmer";

function DreamCoin() {
  const farmer = useDreamCoinFarmer();
  return (
    <Farmer farmer={farmer}>
      <DreamCoinFarmer />
    </Farmer>
  );
}

export default memo(DreamCoin);
