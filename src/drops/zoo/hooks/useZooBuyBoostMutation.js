import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooBuyBoostMutation() {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["zoo", "boost", "buy"],
    mutationFn: (data) => {
      const body = {
        data,
      };

      return api
        .post("https://api.zoo.team/boost/buy", body, {
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
