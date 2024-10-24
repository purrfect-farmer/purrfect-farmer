import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";
import useMajorUserStreakQuery from "./useMajorUserStreakQuery";

export default function useMajorUserQuery() {
  const api = useFarmerApi();

  const streakQuery = useMajorUserStreakQuery();

  const userQuery = useQuery({
    enabled: streakQuery.isSuccess,
    queryKey: ["major", "user", streakQuery.data?.["user_id"]],
    queryFn: ({ signal }) =>
      api
        .get(`https://major.bot/api/users/${streakQuery.data?.["user_id"]}/`, {
          signal,
        })
        .then((res) => res.data),
  });

  return userQuery;
}
