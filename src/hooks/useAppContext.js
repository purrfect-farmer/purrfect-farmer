import AppContext from "@/contexts/AppContext";
import { useContext } from "react";

export default function useAppContext() {
  return useContext(AppContext);
}
