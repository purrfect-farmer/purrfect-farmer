import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useBlumDogsDropEligibilityQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["blum", "dogs-drop", "eligibility"],
    queryFn: ({ signal }) =>
      api
        .get(
          "https://game-domain.blum.codes/api/v2/game/eligibility/dogs_drop",
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
