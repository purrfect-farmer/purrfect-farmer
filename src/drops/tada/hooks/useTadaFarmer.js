import useDropFarmer from "@/hooks/useDropFarmer";

import TadaIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useTadaFarmer() {
  return useDropFarmer({
    id: "tada",
    host: "tada-mini.mvlchain.io",
    notification: {
      icon: TadaIcon,
      title: "Tada Farmer",
    },
    domains: ["backend.clutchwalletserver.xyz"],
  });
}
