import Farmer from "@/components/Farmer";
import { memo } from "react";

import PumpadFarmer from "./components/PumpadFarmer";
import usePumpadFarmer from "./hooks/usePumpadFarmer";

function Pumpad() {
  const farmer = usePumpadFarmer();
  return (
    <Farmer farmer={farmer}>
      <PumpadFarmer />
    </Farmer>
  );
}

export default memo(Pumpad);
