import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useAgent301LotteryMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["agent301", "lottery", "spin"],
    mutationFn: () =>
      api
        .post("https://api.agent301.org/wheel/spin", {})
        .then((res) => res.data),
  });
}
