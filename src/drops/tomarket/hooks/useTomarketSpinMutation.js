import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketSpinMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tomarket", "lottery", "spin"],
    mutationFn: () =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/spin/raffle", {
          category: "ticket_spin_1",
        })
        .then((res) => res.data.data),
  });
}
