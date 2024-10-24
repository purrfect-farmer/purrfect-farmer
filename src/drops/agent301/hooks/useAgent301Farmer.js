import useDropFarmer from "@/hooks/useDropFarmer";

import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";

export default function useAgent301Farmer() {
  return useDropFarmer({
    id: "agent301",
    host: "static.agent301.org",
    notification: {
      icon: Agent301Icon,
      title: "Agent301 Farmer",
    },
    domains: ["*.agent301.org"],
  });
}
