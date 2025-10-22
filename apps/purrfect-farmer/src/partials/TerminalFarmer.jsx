import Farmer from "@/components/Farmer";
import useDropFarmer from "@/hooks/useDropFarmer";
import { memo } from "react";
import { TerminalFarmerContent } from "./TerminalFarmerContent";

function TerminalFarmer() {
  const farmer = useDropFarmer();
  return (
    <Farmer farmer={farmer}>
      <TerminalFarmerContent />
    </Farmer>
  );
}

export default memo(TerminalFarmer);
