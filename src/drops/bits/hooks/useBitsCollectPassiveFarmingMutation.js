import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsCollectPassiveFarmingMutation() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useMutation({
    mutationKey: ["bits", "passive", "collect"],
    mutationFn: () =>
      api
        .get(
          `https://api-bits.apps-tonbox.me/api/v1/passive/collect?access_token=${token}`
        )
        .then((res) => res.data),
  });
}
