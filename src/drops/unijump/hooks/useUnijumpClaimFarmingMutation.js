import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpClaimFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "claim-farming"],
    mutationFn: () => {
      return api
        .post("https://unijump.xyz/api/v1/farming/claim", {})
        .then((res) => res.data);
    },
  });
}
