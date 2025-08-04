import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useTruecoinUserArchivesQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["truecoin", "user", "archives"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.true.world/api/game/getUserAchives", {
          signal,
        })
        .then((res) => res.data),
  });
}
