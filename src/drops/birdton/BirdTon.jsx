import Farmer from "@/components/Farmer";
import { memo } from "react";

import BirdTonFarmer from "./components/BirdTonFarmer";
import useBirdTon from "./hooks/useBirdTon";
import useBirdTonFarmer from "./hooks/useBirdTonFarmer";

export default memo(function BirdTon() {
  const farmer = useBirdTon(useBirdTonFarmer());

  return (
    <Farmer
      farmer={farmer}
      className="bg-sky-500 text-white"
      initClassName="text-sky-100"
    >
      <BirdTonFarmer />
    </Farmer>
  );
});
