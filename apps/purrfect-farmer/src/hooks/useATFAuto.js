import ATFAutoContext from "@/contexts/ATFAutoContext";
import { useContext } from "react";

export default function useATFAuto() {
  return useContext(ATFAutoContext);
}
