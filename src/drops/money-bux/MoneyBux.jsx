import Farmer from "@/components/Farmer";
import { memo } from "react";

import MoneyBuxFarmer from "./components/MoneyBuxFarmer";
import useMoneyBuxFarmer from "./hooks/useMoneyBuxFarmer";

function MoneyBux() {
  const farmer = useMoneyBuxFarmer();
  return (
    <Farmer farmer={farmer}>
      <MoneyBuxFarmer />
    </Farmer>
  );
}

export default memo(MoneyBux);
