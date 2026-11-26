import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";
import { FARMER_MODE } from "@/constants/farmerMode";

/** The query key of the signed in devices */
export const TELEGRAM_DEVICES_QUERY_KEY = ["telegram", "devices"];

/** Order devices with this one first, then by last activity */
const sortDevices = (devices) =>
  [...devices].sort(
    (a, b) =>
      Number(Boolean(b.current)) - Number(Boolean(a.current)) ||
      b.dateActive - a.dateActive,
  );

/** A hook for loading the devices signed in to the local session's account */
export default function useTelegramDevicesQuery() {
  const { farmerMode, telegramClient } = useAppContext();
  const ref = telegramClient.ref;

  return useQuery({
    gcTime: 0,
    refetchOnWindowFocus: false,
    enabled: farmerMode === FARMER_MODE.SESSION && telegramClient.hasSession,
    queryKey: TELEGRAM_DEVICES_QUERY_KEY,
    queryFn: async () => {
      /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient.js").default} */
      const client = ref.current;

      /** Load and order the devices */
      const devices = await client.getAuthorizations();
      return sortDevices(devices);
    },
  });
}
