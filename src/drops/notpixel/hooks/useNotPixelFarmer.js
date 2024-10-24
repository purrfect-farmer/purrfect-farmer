import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import NotPixelIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useNotPixelFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "notpixel",
        host: "app.notpx.app",
        notification: {
          icon: NotPixelIcon,
          title: "NotPixel Farmer",
        },
        domains: ["notpx.app"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        userRequest: "https://notpx.app/api/v1/users/me",
        templateRequest: "https://notpx.app/api/v1/image/template/my",
        miningStatusRequest: "https://notpx.app/api/v1/mining/status",
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
