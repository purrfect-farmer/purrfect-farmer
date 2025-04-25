import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useUnijumpAchievementsListQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["unijump", "achievements", "list"],
    queryFn: ({ signal }) =>
      api
        .get("https://unijump.xyz/api/v1/achievements/list", {
          signal,
        })
        .then((res) => res.data),
  });
}
