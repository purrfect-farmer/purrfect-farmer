import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";
import { getHrumHeaders } from "../lib/utils";

export default function useHrumOpenMutation() {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["hrum", "open"],
    mutationFn: () => {
      const body = {};

      return api
        .post("https://api.hrum.me/user/cookie/open", body, {
          headers: getHrumHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
