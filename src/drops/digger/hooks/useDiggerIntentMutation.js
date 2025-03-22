import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerIntentMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["digger", "intent"],
    mutationFn: ({ platform, type }) =>
      api
        .post("https://api.diggergame.app/api/content/intent", {
          type,
          platform,
        })
        .then((res) => res.data.result),
  });
}
