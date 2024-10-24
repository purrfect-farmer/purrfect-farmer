import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsSpinRollMutation() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useMutation({
    mutationKey: ["bits", "spin", "roll"],
    mutationFn: () =>
      api
        .post(
          `https://api-bits.apps-tonbox.me/api/v1/spin/roll?access_token=${token}`,
          null
        )
        .then((res) => res.data),
  });
}
