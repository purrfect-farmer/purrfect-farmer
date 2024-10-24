import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useGoatsUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["goats", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-me.goatsbot.xyz/users/me", {
          signal,
        })
        .then((res) => res.data),
  });
}
