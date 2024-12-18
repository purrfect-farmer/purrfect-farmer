import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooBuyAnimalMutation() {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["zoo", "animal", "buy"],
    mutationFn: ({ position, animalKey }) => {
      const body = {
        data: { position, animalKey },
      };

      return api
        .post("https://api.zoo.team/animal/buy", body, {
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
