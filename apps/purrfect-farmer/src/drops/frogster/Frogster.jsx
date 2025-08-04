import Farmer from "@/components/Farmer";
import { memo } from "react";

import FrogsterFarmer from "./components/FrogsterFarmer";
import useFrogsterFarmer from "./hooks/useFrogsterFarmer";

function Frogster() {
  const farmer = useFrogsterFarmer();
  return (
    <Farmer farmer={farmer}>
      <FrogsterFarmer />
    </Farmer>
  );
}

export default memo(Frogster);
