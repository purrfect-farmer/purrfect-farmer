import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useUnijumpPlayerStateQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["unijump", "player", "state"],
    queryFn: ({ signal }) =>
      api
        .get("https://unijump.xyz/api/v1/player/state", {
          signal,
        })
        .then((res) => res.data),
  });
}
