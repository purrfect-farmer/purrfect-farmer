import useFarmerApi from "@/hooks/useFarmerApi";
import { extraGamePoints } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimGameMutation(points, perItem) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "game", "claim", points, perItem],
    mutationFn: ({ bonusRound }) =>
      api
        .post("https://wonton.food/api/v1/user/finish-game", {
          hasBonus: bonusRound,
          points: Math.floor(extraGamePoints(points) * perItem),
        })
        .then((res) => res.data),
  });
}
