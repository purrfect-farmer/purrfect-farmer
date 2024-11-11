import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useTruecoinWallFeedQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["truecoin", "wall", "feed"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.true.world/api/ad/getWallFeed", {
          signal,
        })
        .then((res) => res.data),
  });
}
