import useDropFarmer from "@/hooks/useDropFarmer";

import WontonIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useWontonFarmer() {
  return useDropFarmer({
    id: "wonton",
    host: "www.wonton.restaurant",
    notification: {
      icon: WontonIcon,
      title: "Wonton Farmer",
    },
    domains: ["*.wonton.food"],
  });
}
