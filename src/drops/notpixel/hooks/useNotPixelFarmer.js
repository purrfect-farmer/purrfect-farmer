import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import NotPixelIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useNotPixelFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "notpixel",
        host: "app.notpx.app",
        notification: {
          icon: NotPixelIcon,
          title: "NotPixel Farmer",
        },
        domains: ["notpx.app"],
        tasks: ["paint"],
      }),
      []
    )
  );
}
