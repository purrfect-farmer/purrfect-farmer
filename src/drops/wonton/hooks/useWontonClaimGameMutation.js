import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimGameMutation(points, perItem) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "game", "claim", points],
    mutationFn: ({ bonusRound }) =>
      api
        .post("https://wonton.food/api/v1/user/finish-game", {
          hasBonus: bonusRound,
          points: Math.floor(
            (points + Math.floor(Math.random() * 20)) * perItem
          ),
        })
        .then((res) => res.data),
  });
}
