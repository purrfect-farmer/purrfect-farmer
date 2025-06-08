import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useHrumCheckQuestMutation(key) {
  const { api } = useFarmerContext();

  return useMutation({
    mutationKey: ["hrum", "quests", key, "check"],
    mutationFn: (data) => {
      return api
        .post("https://api.hrum.me/quests/check", data)
        .then((res) => res.data.data);
    },
  });
}
