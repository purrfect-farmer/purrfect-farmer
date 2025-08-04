import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useTomarketBalanceQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["tomarket", "balance"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api-web.tomarket.ai/tomarket-game/v1/user/balance",
          null,
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
