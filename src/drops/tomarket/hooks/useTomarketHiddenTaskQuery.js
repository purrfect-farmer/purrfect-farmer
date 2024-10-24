import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useTomarketHiddenTaskQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["tomarket", "hidden-task"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api-web.tomarket.ai/tomarket-game/v1/tasks/hidden",
          null,
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
