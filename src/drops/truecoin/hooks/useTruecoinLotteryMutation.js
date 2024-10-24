import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTruecoinLotteryMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["truecoin", "lottery", "spin"],
    mutationFn: () =>
      api.get("https://api.true.world/api/game/roll").then((res) => res.data),
  });
}
