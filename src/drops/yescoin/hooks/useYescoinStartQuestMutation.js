import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinStartQuestMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "quest", "start"],
    mutationFn: (id) =>
      api
        .get(`https://bi.yescoin.gold/quest/start?questId=${id}`)
        .then((res) => res.data.data),
  });
}
