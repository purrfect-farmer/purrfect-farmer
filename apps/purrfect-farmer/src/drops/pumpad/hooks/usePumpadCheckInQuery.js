import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadCheckInQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["pumpad", "check-in", "list"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/tg/raffle/checkin", {
          signal,
        })
        .then((res) => res.data),
  });
}
