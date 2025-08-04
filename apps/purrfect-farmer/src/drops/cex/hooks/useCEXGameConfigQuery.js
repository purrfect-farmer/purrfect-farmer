import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useCEXGameConfigQuery() {
  const { api, payload } = useFarmerContext();
  return useQuery({
    queryKey: ["cex", "game-config"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://app.cexptap.com/api/v2/getGameConfig",
          {
            ...payload,
            data: {},
          },
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
