import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinRecoverSpecialBoxMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "recover", "special-box", "claim"],
    mutationFn: () =>
      api
        .post("https://api-backend.yescoin.fun/game/recoverSpecialBox")
        .then((res) => res.data.data),
  });
}
