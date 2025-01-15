import useDropFarmer from "@/hooks/useDropFarmer";
import useValuesMemo from "@/hooks/useValuesMemo";
import { useMemo } from "react";

import CEXIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useCEXFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "cex",
        host: "app.cexptap.com",
        notification: {
          icon: CEXIcon,
          title: "CEX Farmer",
        },
        domains: ["app.cexptap.com"],
        authHeaders: ["x-appl-version", "x-request-userhash"],
        // syncToCloud: true,
      }),
      []
    )
  );

  /** Payload */
  const payload = useMemo(
    () => ({
      authData: farmer.telegramWebApp?.initData,
      devAuthData: farmer.telegramWebApp?.initDataUnsafe?.user?.id,
      platform: "android",
    }),
    [farmer.telegramWebApp]
  );

  return useValuesMemo({
    ...farmer,
    payload,
  });
}
