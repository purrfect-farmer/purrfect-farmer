import Farmer from "@/components/Farmer";
import { memo } from "react";

import RektFarmer from "./components/RektFarmer";
import RektTerms from "./components/RektTerms";
import useRektFarmer from "./hooks/useRektFarmer";

function Rekt() {
  const farmer = useRektFarmer();
  return (
    <Farmer
      farmer={farmer}
      className="text-white bg-blue-700"
      initClassName="text-blue-100"
    >
      <RektTerms>
        <RektFarmer />
      </RektTerms>
    </Farmer>
  );
}

export default memo(Rekt);
