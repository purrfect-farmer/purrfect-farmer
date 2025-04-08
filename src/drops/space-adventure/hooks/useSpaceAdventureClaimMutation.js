import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureClaimMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "claim"],
    mutationFn: () =>
      api
        .post("https://space-adventure.online/api/game/claiming/")
        .then((res) => res.data),
  });
}
