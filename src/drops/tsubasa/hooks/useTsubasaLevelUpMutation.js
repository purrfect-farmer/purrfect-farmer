import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTsubasaLevelUpMutation() {
  const { api, initData } = useFarmerContext();
  return useMutation({
    mutationKey: ["tsubasa", "card", "level-up"],
    mutationFn: ({ cardId, categoryId }) =>
      api
        .post("https://api.app.ton.tsubasa-rivals.com/api/card/levelup", {
          ["card_id"]: cardId,
          ["category_id"]: categoryId,
          initData,
        })
        .then((res) => res.data),
  });
}
