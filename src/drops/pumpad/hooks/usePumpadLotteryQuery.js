import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadLotteryQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["pumpad", "lottery"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/lottery", {
          signal,
        })
        .then((res) => res.data),
  });
}
