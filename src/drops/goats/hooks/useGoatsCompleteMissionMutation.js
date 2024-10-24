import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useGoatsCompleteMissionMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["goats", "mission", "complete"],
    mutationFn: (id) =>
      api
        .post(`https://dev-api.goatsbot.xyz/missions/action/${id}`, null)
        .then((res) => res.data),
  });
}
