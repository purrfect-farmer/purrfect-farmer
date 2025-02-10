import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinReportQuestMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "quest", "report"],
    mutationFn: ({ id, type }) =>
      api
        .get(`https://bi.yescoin.gold/quest/report?questId=${id}&type=${type}`)
        .then((res) => res.data.data),
  });
}
