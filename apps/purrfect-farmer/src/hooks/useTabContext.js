import TabContext from "@/contexts/TabContext";
import { useContext } from "react";

export default function useTabContext() {
  return useContext(TabContext);
}
