import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsClaimFreeTicketMutation() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useMutation({
    mutationKey: ["bits", "free-ticket", "claim"],
    mutationFn: () =>
      api
        .post(
          `https://api-bits.apps-tonbox.me/api/v1/lottery/free_ticket/claim?access_token=${token}`,
          null
        )
        .then((res) => res.data),
  });
}
