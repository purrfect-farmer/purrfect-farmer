import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooAllianceQuery() {
  const { api, telegramWebApp } = useFarmerContext();

  return useQuery({
    queryKey: ["zoo", "alliance"],
    queryFn: ({ signal }) => {
      const body = {
        data: telegramWebApp?.initDataUnsafe?.user?.id.toString(),
      };

      return api
        .post("https://api.zoo.team/alliance/user/info", body, {
          signal,
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
