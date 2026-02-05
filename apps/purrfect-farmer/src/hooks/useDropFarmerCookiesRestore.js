import { setCookies } from "@/utils/index";
import { useEffect } from "react";

export default function useDropFarmerCookiesRestore(enabled = false, cookies) {
  useEffect(() => {
    if (enabled && cookies) {
      setCookies(cookies);
    }
  }, [enabled, cookies]);
}
