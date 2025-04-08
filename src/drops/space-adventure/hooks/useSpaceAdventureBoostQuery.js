import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useSpaceAdventureBoostQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["space-adventure", "boost"],
    queryFn: ({ signal }) =>
      api
        .get("https://space-adventure.online/api/boost/get/", {
          signal,
        })
        .then((res) => res.data),
  });
}
