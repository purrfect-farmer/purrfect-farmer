import Farmer from "@/components/Farmer";
import { memo } from "react";
import CEXFarmer from "./components/CEXFarmer";
import useCEXFarmer from "./hooks/useCEXFarmer";

function CEX() {
  const farmer = useCEXFarmer();
  return (
    <Farmer farmer={farmer}>
      <CEXFarmer />
    </Farmer>
  );
}

export default memo(CEX);
