import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimGameMutation(points) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "game", "claim", points],
    mutationFn: (hasBonus = false) =>
      api
        .post("https://wonton.food/api/v1/user/finish-game", {
          hasBonus,
          points: points + Math.floor(Math.random() * 20),
        })
        .then((res) => res.data),
  });
}
