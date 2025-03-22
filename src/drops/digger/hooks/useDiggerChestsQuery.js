import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useDiggerChestsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["digger", "chests"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.diggergame.app/api/user-chest/list", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
