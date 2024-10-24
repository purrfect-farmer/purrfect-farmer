import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";
import { getHrumHeaders } from "../lib/utils";

export default function useHrumAfterQuery() {
  const { api, telegramWebApp } = useFarmerContext();

  return useQuery({
    queryKey: ["hrum", "after"],
    queryFn: ({ signal }) => {
      const body = {
        data: { lang: "en" },
      };

      return api
        .post("https://api.hrum.me/user/data/after", body, {
          signal,
          headers: getHrumHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
