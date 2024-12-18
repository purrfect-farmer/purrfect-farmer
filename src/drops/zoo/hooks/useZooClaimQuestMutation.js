import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooClaimQuestMutation(key) {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["zoo", "quests", key, "claim"],
    mutationFn: (data) => {
      const body = {
        data,
      };

      return api
        .post("https://api.zoo.team/quests/claim", body, {
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
