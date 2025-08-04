import { memo } from "react";
import FunaticFarmer from "./components/FunaticFarmer";
import useFunaticFarmer from "./hooks/useFunaticFarmer";
import Farmer from "@/components/Farmer";

function Funatic() {
  const farmer = useFunaticFarmer();
  return (
    <Farmer farmer={farmer}>
      <FunaticFarmer />
    </Farmer>
  );
}

export default memo(Funatic);
