import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useDiggerCardsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["digger", "cards"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.diggergame.app/api/user/card/list", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
