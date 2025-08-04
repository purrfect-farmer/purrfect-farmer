import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMidasPlayGameMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["midas", "game", "play"],
    mutationFn: () =>
      api
        .post("https://api-tg-app.midas.app/api/game/play", null)
        .then((res) => res.data),
  });
}
