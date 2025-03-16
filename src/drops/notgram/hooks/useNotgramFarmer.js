import useDropFarmer from "@/hooks/useDropFarmer";
import { delayForSeconds } from "@/lib/utils";
import { useMemo } from "react";

import NotgramIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useNotgramFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "notgram",
        host: "notgramgame.fun",
        icon: NotgramIcon,
        title: "Notgram Farmer",

        fetchAuth() {
          return delayForSeconds(10, true).then(() =>
            Promise.resolve({ status: true })
          );
        },
      }),
      []
    )
  );
}
