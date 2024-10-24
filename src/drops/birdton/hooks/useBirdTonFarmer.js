import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import BirdTonIcon from "../assets/images/icon.png?format=webp&w=80";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

export default function useBirdTonFarmer() {
  const farmer = useDropFarmer({
    id: "birdton",
    host: "birdton.site",
    notification: {
      icon: BirdTonIcon,
      title: "BirdTon Farmer",
    },
    domains: ["birdton.site"],
  });

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
