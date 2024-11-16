import useDropFarmer from "@/hooks/useDropFarmer";
import { delay } from "@/lib/utils";
import { useMemo } from "react";

import NotgramIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useNotgramFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "notgram",
        host: "notgramgame.fun",
        notification: {
          icon: NotgramIcon,
          title: "Notgram Farmer",
        },
        fetchAuth() {
          return delay(3000).then(() => Promise.resolve({ status: true }));
        },
      }),
      []
    )
  );
}
