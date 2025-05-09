import { extractInitDataUnsafe } from "@/lib/utils";
import { isBefore, subMinutes } from "date-fns";
import { useMemo } from "react";

export default function useTelegramInitData(telegramInitData) {
  return useMemo(() => {
    if (telegramInitData) {
      const parsed = extractInitDataUnsafe(telegramInitData);
      const shouldUpdate = isBefore(
        new Date(parsed["auth_date"] * 1000),
        subMinutes(new Date(), 10)
      );

      return {
        user: parsed["user"],
        initData: telegramInitData,
        shouldUpdate,
      };
    } else {
      return null;
    }
  }, [telegramInitData]);
}
