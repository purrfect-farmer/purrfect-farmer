import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";
import { getHrumHeaders } from "../lib/utils";

export default function useHrumCheckQuestMutation(key) {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["hrum", "quests", key, "check"],
    mutationFn: (data) => {
      const body = {
        data,
      };

      return api
        .post("https://api.hrum.me/quests/check", body, {
          headers: getHrumHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
