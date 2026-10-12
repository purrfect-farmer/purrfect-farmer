import AutoAccountDialogActionsContext from "@/contexts/AutoAccountDialogActionsContext";
import { useContext } from "react";

export default function useAutoAccountDialogActions() {
  return useContext(AutoAccountDialogActionsContext);
}
