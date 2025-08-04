import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektQuestsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["rekt", "quests"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/quests/user", {
          signal,
        })
        .then((res) => res.data),
  });
}
