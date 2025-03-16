import Farmer from "@/components/Farmer";
import { memo } from "react";

import TomarketFarmer from "./components/TomarketFarmer";
import useTomarket from "./hooks/useTomarket";
import useTomarketFarmer from "./hooks/useTomarketFarmer";

function Tomarket() {
  const farmer = useTomarket(useTomarketFarmer());

  return (
    <Farmer
      farmer={farmer}
      className="text-white bg-rose-500"
      initClassName="text-rose-100"
    >
      <TomarketFarmer />
    </Farmer>
  );
}

export default memo(Tomarket);
