import Farmer from "@/components/Farmer";
import { memo } from "react";

import BlumFarmer from "./components/BlumFarmer";
import useBlumFarmer from "./hooks/useBlumFarmer";

function Blum() {
  const farmer = useBlumFarmer();
  return (
    <Farmer
      farmer={farmer}
      className="text-white bg-black"
      initClassName="text-neutral-400"
    >
      <BlumFarmer />
    </Farmer>
  );
}

export default memo(Blum);
