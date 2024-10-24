import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";
import { getHrumHeaders } from "../lib/utils";

export default function useHrumDailyQuery() {
  const { api, telegramWebApp } = useFarmerContext();

  return useQuery({
    queryKey: ["hrum", "quests", "daily"],
    queryFn: ({ signal }) => {
      const body = {};

      return api
        .post("https://api.hrum.me/quests/daily", body, {
          signal,
          headers: getHrumHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
