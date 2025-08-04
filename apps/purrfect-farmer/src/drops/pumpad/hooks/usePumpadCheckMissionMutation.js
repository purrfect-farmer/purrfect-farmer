import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function usePumpadCheckMissionMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["pumpad", "mission", "check"],
    mutationFn: ({ id, data = {} }) =>
      api
        .post(
          `https://tg.pumpad.io/referral/api/v1/tg/missions/check/${id}`,
          data
        )
        .then((res) => res.data),
  });
}
