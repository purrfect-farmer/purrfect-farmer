import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinCheckQuestMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "quest", "check"],
    mutationFn: (id) =>
      api
        .get(`https://bi.yescoin.gold/quest/check?questId=${id}`)
        .then((res) => res.data.data),
  });
}
