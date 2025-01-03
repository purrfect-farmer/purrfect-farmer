import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import TomarketIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useTomarketFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "tomarket",
        host: "mini-app.tomarket.ai",
        notification: {
          icon: TomarketIcon,
          title: "Tomarket Farmer",
        },
        domains: ["*.tomarket.ai"],
        apiDelay: 500,
      }),
      []
    )
  );
}
