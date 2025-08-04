import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useDiggerItemsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["digger", "items"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.diggergame.app/api/user-item/list", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
