import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsStartSocialTaskMutation() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useMutation({
    mutationKey: ["bits", "social-task", "start"],
    mutationFn: ({ name, adId = null }) =>
      api
        .post(
          `https://api-bits.apps-tonbox.me/api/v1/socialtask/start?access_token=${token}`,
          {
            name,
            adId,
          }
        )
        .then((res) => res.data),
  });
}
