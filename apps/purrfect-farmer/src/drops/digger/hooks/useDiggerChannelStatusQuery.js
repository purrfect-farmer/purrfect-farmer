import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useDiggerChannelStatusQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["digger", "channel-status"],
    queryFn: ({ signal }) =>
      api
        .get(
          "https://api.diggergame.app/api/user-task/channel-subscribe-statuses",
          {
            signal,
          }
        )
        .then((res) => res.data.result),
  });
}
