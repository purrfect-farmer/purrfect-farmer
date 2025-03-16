import Farmer from "@/components/Farmer";
import { memo } from "react";
import BattleBullsFarmer from "./components/BattleBullsFarmer";
import useBattleBullsFarmer from "./hooks/useBattleBullsFarmer";

function BattleBulls() {
  const farmer = useBattleBullsFarmer();
  return (
    <Farmer farmer={farmer}>
      <BattleBullsFarmer />
    </Farmer>
  );
}

export default memo(BattleBulls);
