import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useUnijumpUtcQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["unijump", "utc"],
    queryFn: ({ signal }) =>
      api
        .get("https://unijump.xyz/api/v1/player/utc", {
          signal,
        })
        .then((res) => res.data),
  });
}
