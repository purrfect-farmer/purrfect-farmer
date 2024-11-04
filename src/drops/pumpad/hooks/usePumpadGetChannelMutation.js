import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function usePumpadGetChannelMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["pumpad", "channel", "get"],
    mutationFn: (id) =>
      api
        .get(`https://tg.pumpad.io/referral/api/v1/tg/channel/${id}`)
        .then((res) => res.data),
  });
}
