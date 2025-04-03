import Farmer from "@/components/Farmer";
import { memo } from "react";

import PettFarmer from "./components/PettFarmer";
import usePettFarmer from "./hooks/usePettFarmer";

function Pett() {
  const farmer = usePettFarmer();
  return (
    <Farmer farmer={farmer}>
      <PettFarmer />
    </Farmer>
  );
}

export default memo(Pett);
