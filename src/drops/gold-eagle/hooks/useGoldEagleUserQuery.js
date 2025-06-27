import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useGoldEagleUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["gold-eagle", "user", "me"],
    queryFn: ({ signal }) =>
      api
        .get("https://gold-eagle-api.fly.dev/user/me", {
          signal,
        })
        .then((res) => res.data),
  });
}
