import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useBlumClaimFriendsRewardMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["blum", "friends-reward", "claim"],
    mutationFn: () =>
      api
        .post("https://user-domain.blum.codes/api/v1/friends/claim", null)
        .then((res) => res.data),
  });
}
