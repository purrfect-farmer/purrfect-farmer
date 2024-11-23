import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useTomarketTicketsQuery() {
  const { api, telegramWebApp } = useFarmerContext();
  return useQuery({
    queryKey: ["tomarket", "tickets"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api-web.tomarket.ai/tomarket-game/v1/user/tickets",
          {
            language_code: "en",
            init_data: telegramWebApp.initData,
          },
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
