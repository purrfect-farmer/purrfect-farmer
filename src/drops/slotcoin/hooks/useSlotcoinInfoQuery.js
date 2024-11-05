import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useSlotcoinInfoQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["slotcoin", "info"],
    queryFn: ({ signal }) =>
      api
        .post("https://api.slotcoin.app/v1/clicker/api/info", null, {
          signal,
        })
        .then((res) => res.data),
  });
}
