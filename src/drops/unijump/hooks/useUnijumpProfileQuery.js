import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useUnijumpProfileQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["unijump", "profile"],
    queryFn: ({ signal }) =>
      api
        .get("https://unijump.xyz/api/v1/player/profile", {
          signal,
        })
        .then((res) => res.data),
  });
}
