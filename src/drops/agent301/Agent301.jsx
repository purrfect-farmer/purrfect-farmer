import Farmer from "@/components/Farmer";
import { memo } from "react";

import Agent301Farmer from "./components/Agent301Farmer";
import useAgent301Farmer from "./hooks/useAgent301Farmer";

function Agent301() {
  const farmer = useAgent301Farmer();
  return (
    <Farmer farmer={farmer} className="text-white bg-black">
      <Agent301Farmer />
    </Farmer>
  );
}

export default memo(Agent301);
