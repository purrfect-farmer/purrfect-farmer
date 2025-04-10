import useDropFarmer from "@/hooks/useDropFarmer";
import useValuesMemo from "@/hooks/useValuesMemo";
import { useCallback } from "react";

import { getSpaceAdventureHeaders } from "../lib/utils";

export default function useSpaceAdventureFarmer() {
  const farmer = useDropFarmer();
  const token = farmer.authQuery.data?.token;
  const authId = farmer.telegramWebApp?.initDataUnsafe?.user?.id;
  const getApiHeaders = useCallback(
    () =>
      getSpaceAdventureHeaders({
        token,
        authId,
      }),
    [token, authId]
  );

  return useValuesMemo({
    ...farmer,
    getApiHeaders,
  });
}
