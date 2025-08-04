import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useDiggerChestStatusQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["digger", "chest-status"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.diggergame.app/api/content/chest/status", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
