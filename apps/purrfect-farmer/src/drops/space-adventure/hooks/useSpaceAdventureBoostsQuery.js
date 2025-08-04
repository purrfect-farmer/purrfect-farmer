import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useSpaceAdventureBoostsQuery() {
  const { api, getApiHeaders } = useFarmerContext();
  return useQuery({
    queryKey: ["space-adventure", "boosts"],
    queryFn: async ({ signal }) =>
      api
        .get("https://space-adventure.online/api/boost/get/", {
          signal,
          headers: await getApiHeaders(),
        })
        .then((res) => res.data),
  });
}
