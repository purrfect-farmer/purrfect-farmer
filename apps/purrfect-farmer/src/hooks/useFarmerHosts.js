import farmers from "@/core/farmers";
import { setChromeLocalStorage } from "@/lib/utils";
import { useLayoutEffect } from "react";

export default function useFarmerHosts() {
  useLayoutEffect(() => {
    setChromeLocalStorage(
      "shared:hosts",
      farmers.map((item) => item.host).filter(Boolean)
    );
  }, []);
}
