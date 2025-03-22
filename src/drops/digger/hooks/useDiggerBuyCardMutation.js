import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerBuyCardMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["digger", "card", "buy"],
    mutationFn: (id) =>
      api
        .post("https://api.diggergame.app/api/user/card/buy", {
          ["card_id"]: id,
        })
        .then((res) => res.data.result),
  });
}
