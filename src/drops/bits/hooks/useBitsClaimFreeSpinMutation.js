import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsClaimFreeSpinMutation() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useMutation({
    mutationKey: ["bits", "free-spin", "claim"],
    mutationFn: () =>
      api
        .post(
          `https://api-bits.apps-tonbox.me/api/v1/lottery/free_spin/claim?access_token=${token}`,
          null
        )
        .then((res) => res.data),
  });
}
