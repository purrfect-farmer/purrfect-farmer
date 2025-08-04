import Farmer from "@/components/Farmer";
import { memo } from "react";

import TruecoinFarmer from "./components/TruecoinFarmer";
import useTruecoinFarmer from "./hooks/useTruecoinFarmer";

function Truecoin() {
  const farmer = useTruecoinFarmer();
  return (
    <Farmer farmer={farmer}>
      <TruecoinFarmer />
    </Farmer>
  );
}

export default memo(Truecoin);
