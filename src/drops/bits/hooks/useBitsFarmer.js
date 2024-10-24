import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import BitsIcon from "../assets/images/icon.png?format=webp&w=80";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

export default function useBitsFarmer() {
  const farmer = useDropFarmer({
    id: "bits",
    host: "bits.apps-tonbox.me",
    notification: {
      icon: BitsIcon,
      title: "Bits Farmer",
    },
    domains: ["api-bits.apps-tonbox.me"],
  });

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        userRequest: "https://api-bits.apps-tonbox.me/api/v1/auth",
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
