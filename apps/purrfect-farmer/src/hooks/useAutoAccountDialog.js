import AutoAccountDialogContext from "@/contexts/AutoAccountDialogContext";
import { useContext } from "react";

export default function useAutoAccountDialog() {
  return useContext(AutoAccountDialogContext);
}
