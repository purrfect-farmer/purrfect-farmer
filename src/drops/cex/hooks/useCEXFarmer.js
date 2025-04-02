import useDropFarmer from "@/hooks/useDropFarmer";
import useValuesMemo from "@/hooks/useValuesMemo";
import { useMemo } from "react";

export default function useCEXFarmer() {
  const farmer = useDropFarmer();

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
