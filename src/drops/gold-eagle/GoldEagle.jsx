import Farmer from "@/components/Farmer";
import { memo } from "react";
import GoldEagleFarmer from "./components/GoldEagleFarmer";
import useGoldEagleFarmer from "./hooks/useGoldEagleFarmer";

function GoldEagle() {
  const farmer = useGoldEagleFarmer();
  return (
    <Farmer farmer={farmer}>
      <GoldEagleFarmer />
    </Farmer>
  );
}

export default memo(GoldEagle);
