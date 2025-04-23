import updateDynamicRules from "@/lib/updateDynamicRules";
import { useLayoutEffect } from "react";

export default function useDynamicRules() {
  useLayoutEffect(() => {
    updateDynamicRules();
  }, []);
}
