import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useSlotcoinCheckInInfoQuery() {
  const { api, isMutating } = useFarmerContext();
  return useQuery({
    refetchInterval: isMutating < 1 ? 20000 : false,
    queryKey: ["slotcoin", "check-in", "info"],
    queryFn: ({ signal }) =>
      api
        .post("https://api.slotcoin.app/v1/clicker/check-in/info", null, {
          signal,
        })
        .then((res) => res.data),
  });
}
