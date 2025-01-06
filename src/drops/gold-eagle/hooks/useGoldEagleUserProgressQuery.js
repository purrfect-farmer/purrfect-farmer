import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useGoldEagleUserProgressQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["gold-eagle", "user", "progress"],
    queryFn: ({ signal }) =>
      api
        .get("https://gold-eagle-api.fly.dev/user/me/progress", {
          signal,
        })
        .then((res) => res.data),
  });
}
