import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadTicketsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["pumpad", "tickets"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/tg/raffle/tickets", {
          signal,
        })
        .then((res) => res.data),
  });
}
