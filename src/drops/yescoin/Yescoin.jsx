import Farmer from "@/components/Farmer";
import { memo } from "react";

import YescoinFarmer from "./components/YescoinFarmer";
import useYescoinFarmer from "./hooks/useYescoinFarmer";

function Yescoin() {
  const farmer = useYescoinFarmer();
  return (
    <Farmer farmer={farmer}>
      <YescoinFarmer />
    </Farmer>
  );
}

export default memo(Yescoin);
