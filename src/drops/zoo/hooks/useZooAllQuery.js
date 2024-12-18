import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooAllQuery() {
  const { api, telegramWebApp } = useFarmerContext();

  return useQuery({
    queryKey: ["zoo", "all"],
    queryFn: ({ signal }) => {
      const body = {
        data: {},
      };

      return api
        .post("https://api.zoo.team/user/data/all", body, {
          signal,
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
