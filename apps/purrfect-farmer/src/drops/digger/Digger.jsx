import Farmer from "@/components/Farmer";
import { memo } from "react";

import DiggerFarmer from "./components/DiggerFarmer";
import useDiggerFarmer from "./hooks/useDiggerFarmer";

function Digger() {
  const farmer = useDiggerFarmer();
  return (
    <Farmer farmer={farmer}>
      <DiggerFarmer />
    </Farmer>
  );
}

export default memo(Digger);
