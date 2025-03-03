import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useSlotcoinCheckInInfoQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    refetchInterval: 20000,
    queryKey: ["slotcoin", "check-in", "info"],
    queryFn: ({ signal }) =>
      api
        .post("https://api.slotcoin.app/v1/clicker/check-in/info", null, {
          signal,
        })
        .then((res) => res.data),
  });
}
