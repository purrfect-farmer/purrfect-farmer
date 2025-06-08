import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useHrumClaimQuestMutation(key) {
  const { api } = useFarmerContext();

  return useMutation({
    mutationKey: ["hrum", "quests", key, "claim"],
    mutationFn: (data) => {
      return api
        .post("https://api.hrum.me/quests/claim", data)
        .then((res) => res.data.data);
    },
  });
}
