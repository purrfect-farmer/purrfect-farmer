import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useHrumDailyClaimMutation() {
  const { api } = useFarmerContext();

  return useMutation({
    mutationKey: ["hrum", "quests", "daily", "claim"],
    mutationFn: (data) => {
      return api
        .post("https://api.hrum.me/quests/daily/claim", data)
        .then((res) => res.data.data);
    },
  });
}
