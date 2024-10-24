import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import BirdTonIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBirdTonFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "birdton",
        host: "birdton.site",
        notification: {
          icon: BirdTonIcon,
          title: "BirdTon Farmer",
        },
        domains: [],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        userRequest: "https://birdton.site/auth",
      }),
      []
    )
  );

  return useMemo(
    () => ({
      ...farmer,
      ...requests,
    }),
    [farmer, requests]
  );
}
