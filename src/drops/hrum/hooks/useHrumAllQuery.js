import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";
import { getHrumHeaders } from "../lib/utils";

export default function useHrumAllQuery() {
  const { api, telegramWebApp } = useFarmerContext();

  return useQuery({
    queryKey: ["hrum", "all"],
    queryFn: ({ signal }) => {
      const body = {
        data: {},
      };

      return api
        .post("https://api.hrum.me/user/data/all", body, {
          signal,
          headers: getHrumHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
