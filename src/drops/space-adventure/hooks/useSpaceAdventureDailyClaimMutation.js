import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureDailyClaimMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "daily", "claim"],
    mutationFn: () =>
      api
        .post("https://space-adventure.online/api/dayli/claim_activity/")
        .then((res) => res.data),
  });
}
