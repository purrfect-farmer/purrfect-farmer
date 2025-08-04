import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticActivateBoosterMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "booster", "activate"],
    mutationFn: (boosterType) =>
      api
        .post("https://clicker.api.funtico.com/boosters/activate", {
          boosterType,
        })
        .then((res) => res.data.data),
  });
}
