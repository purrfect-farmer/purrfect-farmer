import Farmer from "@/components/Farmer";
import { memo } from "react";

import WontonFarmer from "./components/WontonFarmer";
import useWontonFarmer from "./hooks/useWontonFarmer";

function Wonton() {
  const farmer = useWontonFarmer();
  return (
    <Farmer farmer={farmer}>
      <WontonFarmer />
    </Farmer>
  );
}

export default memo(Wonton);
