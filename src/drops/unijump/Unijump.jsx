import Farmer from "@/components/Farmer";
import { memo } from "react";

import UnijumpFarmer from "./components/UnijumpFarmer";
import useUnijumpFarmer from "./hooks/useUnijumpFarmer";

function Unijump() {
  const farmer = useUnijumpFarmer();
  return (
    <Farmer farmer={farmer}>
      <UnijumpFarmer />
    </Farmer>
  );
}

export default memo(Unijump);
