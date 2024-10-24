import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTadaStartActivityMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tada", "activity", "start"],
    mutationFn: (activity) =>
      api
        .post(
          `https://backend.clutchwalletserver.xyz/activity/v3/activities/${activity}`,
          null
        )
        .then((res) => res.data),
  });
}
