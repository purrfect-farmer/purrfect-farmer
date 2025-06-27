import Farmer from "@/components/Farmer";
import { memo } from "react";

import TsubasaFarmer from "./components/TsubasaFarmer";
import useTsubasa from "./hooks/useTsubasa";
import useTsubasaFarmer from "./hooks/useTsubasaFarmer";

function Tsubasa() {
  const farmer = useTsubasa(useTsubasaFarmer());
  return (
    <Farmer farmer={farmer}>
      <TsubasaFarmer />
    </Farmer>
  );
}

export default memo(Tsubasa);
