import farmers from "@/core/farmers";
import storage from "@/lib/storage";
import { useLayoutEffect } from "react";

export default function useFarmerHosts() {
  useLayoutEffect(() => {
    storage.set(
      "shared:hosts",
      farmers.map((item) => item.host).filter(Boolean)
    );
  }, []);
}
