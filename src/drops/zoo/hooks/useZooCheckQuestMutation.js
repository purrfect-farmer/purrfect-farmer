import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooCheckQuestMutation(key) {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["zoo", "quests", key, "check"],
    mutationFn: (data) => {
      const body = {
        data,
      };

      return api
        .post("https://api.zoo.team/quests/check", body, {
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
