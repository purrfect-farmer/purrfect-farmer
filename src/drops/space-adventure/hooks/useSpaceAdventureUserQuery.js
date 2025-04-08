import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useSpaceAdventureUserQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["space-adventure", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://space-adventure.online/api/user/get", {
          signal,
        })
        .then((res) => res.data),
  });
}
