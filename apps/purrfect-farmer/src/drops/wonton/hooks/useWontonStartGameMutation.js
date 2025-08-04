import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonStartGameMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "game", "start"],
    mutationFn: () =>
      api
        .post("https://wonton.food/api/v1/user/start-game", null)
        .then((res) => res.data),
  });
}
