import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerSubscribeToChannelMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["digger", "subscribe-to-channel"],
    mutationFn: () =>
      api
        .post(
          "https://api.diggergame.app/api/user-task/subscribe-to-channel/check",
          null
        )
        .then((res) => res.data.result),
  });
}
