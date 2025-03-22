import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import FunaticIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useFunaticFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "funatic",
        host: "clicker.funtico.com",
        notification: {
          icon: FunaticIcon,
          title: "Funatic Farmer",
        },
        domains: ["*.funtico.com"],
        extractAuthHeaders(headers) {
          return headers.filter(
            (header) =>
              header.name.toLowerCase() === "authorization" &&
              header.value !== "Bearer undefined"
          );
        },
        apiDelay: 200,
        syncToCloud: true,
      }),
      []
    )
  );
}
