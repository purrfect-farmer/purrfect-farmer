import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsClaimSocialTaskMutation() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useMutation({
    mutationKey: ["bits", "social-task", "claim"],
    mutationFn: ({ name }) =>
      api
        .post(
          `https://api-bits.apps-tonbox.me/api/v1/socialtask/claim?access_token=${token}`,
          {
            name,
          }
        )
        .then((res) => res.data),
  });
}
