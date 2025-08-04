import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureClaimMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "claim"],
    mutationFn: async () =>
      api
        .post("https://space-adventure.online/api/game/claiming/", null, {
          headers: await getApiHeaders(),
        })
        .then((res) => res.data),
  });
}
