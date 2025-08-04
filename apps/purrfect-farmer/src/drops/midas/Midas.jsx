import Farmer from "@/components/Farmer";
import { memo } from "react";

import MidasFarmer from "./components/MidasFarmer";
import useMidasFarmer from "./hooks/useMidasFarmer";

function Midas() {
  const farmer = useMidasFarmer();
  return (
    <Farmer farmer={farmer}>
      <MidasFarmer />
    </Farmer>
  );
}

export default memo(Midas);
