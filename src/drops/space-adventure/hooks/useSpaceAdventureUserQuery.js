import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useSpaceAdventureUserQuery() {
  const { api, getApiHeaders } = useFarmerContext();
  return useQuery({
    queryKey: ["space-adventure", "user"],
    queryFn: async ({ signal }) =>
      api
        .get("https://space-adventure.online/api/user/get", {
          signal,
          headers: await getApiHeaders(),
        })
        .then((res) => res.data),
  });
}
