import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import RektIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useRektFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "rekt",
        host: "rekt-mini-app.vercel.app",
        notification: {
          icon: RektIcon,
          title: "Rekt Farmer",
        },
        authHeaders: ["auth-token"],
        domains: ["rekt-mini-app.vercel.app"],
      }),
      []
    )
  );
}
