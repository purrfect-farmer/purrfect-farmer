import Farmer from "@/components/Farmer";
import { memo } from "react";

import NeubeatFarmer from "./components/NeubeatFarmer";
import useNeubeatFarmer from "./hooks/useNeubeatFarmer";

function Neubeat() {
  const farmer = useNeubeatFarmer();
  return (
    <Farmer farmer={farmer}>
      <NeubeatFarmer />
    </Farmer>
  );
}

export default memo(Neubeat);
