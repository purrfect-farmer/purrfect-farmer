import AutoContext from "@/contexts/AutoContext";
import { useContext } from "react";

export default function useAuto() {
  return useContext(AutoContext);
}
