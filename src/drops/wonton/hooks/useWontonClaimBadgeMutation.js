import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimBadgeMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "badge", "claim"],
    mutationFn: (type) =>
      api
        .post("https://wonton.food/api/v1/badge/claim", { type })
        .then((res) => res.data),
  });
}
