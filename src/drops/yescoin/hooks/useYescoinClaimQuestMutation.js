import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinClaimQuestMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "quest", "claim"],
    mutationFn: (id) =>
      api
        .get(`https://bi.yescoin.gold/quest/claim?questId=${id}`)
        .then((res) => res.data.data),
  });
}
