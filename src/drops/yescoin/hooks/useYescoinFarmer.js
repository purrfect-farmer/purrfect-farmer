import useDropFarmer from "@/hooks/useDropFarmer";

import YescoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useYescoinFarmer() {
  return useDropFarmer({
    id: "yescoin",
    host: "www.yescoin.gold",
    notification: {
      icon: YescoinIcon,
      title: "Yescoin Farmer",
    },
    domains: ["*.yescoin.gold"],
    authHeaders: ["token"],
  });
}
