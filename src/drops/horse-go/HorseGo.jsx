import Farmer from "@/components/Farmer";
import { memo } from "react";

import HorseGoFarmer from "./components/HorseGoFarmer";
import useHorseGoFarmer from "./hooks/useHorseGoFarmer";

function HorseGo() {
  const farmer = useHorseGoFarmer();
  return (
    <Farmer
      farmer={farmer}
      className="text-white bg-black"
      initClassName="text-blue-100"
    >
      <HorseGoFarmer />
    </Farmer>
  );
}

export default memo(HorseGo);
