import updateNetRules from "@/lib/updateNetRules";
import { useLayoutEffect } from "react";

export default function useNetRules() {
  useLayoutEffect(() => {
    if (!import.meta.env.VITE_WHISKERS) {
      updateNetRules();
    }
  }, []);
}
