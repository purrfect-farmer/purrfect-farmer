import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticQuestsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["funatic", "quests"],
    queryFn: ({ signal }) =>
      api
        .get("https://clicker.api.funtico.com/quests", {
          signal,
        })
        .then((res) => res.data),
  });
}
