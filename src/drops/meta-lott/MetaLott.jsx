import Farmer from "@/components/Farmer";
import { memo } from "react";

import MetaLottFarmer from "./components/MetaLottFarmer";
import useMetaLottFarmer from "./hooks/useMetaLottFarmer";

function MetaLott() {
  const farmer = useMetaLottFarmer();
  return (
    <Farmer farmer={farmer}>
      <MetaLottFarmer />
    </Farmer>
  );
}

export default memo(MetaLott);
