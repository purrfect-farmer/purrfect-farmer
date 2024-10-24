import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import NotPixelIcon from "../assets/images/icon.png?format=webp&w=80";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

export default function useNotPixelFarmer() {
  const farmer = useDropFarmer({
    id: "notpixel",
    host: "app.notpx.app",
    notification: {
      icon: NotPixelIcon,
      title: "NotPixel Farmer",
    },
    domains: ["notpx.app"],
  });

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        userRequest: "https://notpx.app/api/v1/users/me",
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
