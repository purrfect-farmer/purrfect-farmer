import TerminalFarmerContext from "@/contexts/TerminalFarmerContext";
import { useContext } from "react";

export default function useTerminalFarmerContext() {
  return useContext(TerminalFarmerContext);
}
