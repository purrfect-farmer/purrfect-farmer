import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooAfterQuery() {
  const { api, telegramWebApp } = useFarmerContext();

  return useQuery({
    queryKey: ["zoo", "after"],
    queryFn: ({ signal }) => {
      const body = {
        data: { lang: "en" },
      };

      return api
        .post("https://api.zoo.team/user/data/after", body, {
          signal,
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
