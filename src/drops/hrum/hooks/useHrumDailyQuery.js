import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useHrumDailyQuery() {
  const { api } = useFarmerContext();

  return useQuery({
    queryKey: ["hrum", "quests", "daily"],
    queryFn: ({ signal }) => {
      return api
        .post(
          "https://api.hrum.me/quests/daily",
          {},
          {
            signal,
          }
        )
        .then((res) => res.data.data);
    },
  });
}
