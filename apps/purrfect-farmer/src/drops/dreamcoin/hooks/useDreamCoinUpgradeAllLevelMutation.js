import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinUpgradeAllLevelMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "level", "upgrade-all"],
    mutationFn: () =>
      api
        .post("https://api.dreamcoin.ai/Clicker/upgrade", null)
        .then((res) => res.data),
  });
}
