import FarmerContext from "@/contexts/FarmerContext";
import { useContext } from "react";

export default function useFarmerContext() {
  return useContext(FarmerContext);
}
