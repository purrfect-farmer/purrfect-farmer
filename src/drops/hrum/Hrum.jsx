import Farmer from "@/components/Farmer";
import { memo } from "react";

import HrumFarmer from "./components/HrumFarmer";
import useHrumFarmer from "./hooks/useHrumFarmer";

function Hrum() {
  const farmer = useHrumFarmer();

  return (
    <Farmer
      farmer={farmer}
      className="text-white bg-purple-500"
      initClassName="text-purple-100"
    >
      <HrumFarmer />
    </Farmer>
  );
}

export default memo(Hrum);
