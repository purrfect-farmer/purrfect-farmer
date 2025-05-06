import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpClaimLeagueMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "claim-league"],
    mutationFn: (id) => {
      return api
        .post(`https://unijump.xyz/api/v1/leagues/reward/claim/${id}`, {})
        .then((res) => res.data);
    },
  });
}
