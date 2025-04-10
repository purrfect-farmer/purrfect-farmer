import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureDailyClaimMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "daily", "claim"],
    mutationFn: async () =>
      api
        .post(
          "https://space-adventure.online/api/dayli/claim_activity/",
          null,
          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
