import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useSlotcoinQuestsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["slotcoin", "quests"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api.slotcoin.app/v1/clicker/quests/list",
          {},
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
