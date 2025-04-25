import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpStartFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "start-farming"],
    mutationFn: () => {
      return api
        .post("https://unijump.xyz/api/v1/farming/start", {})
        .then((res) => res.data);
    },
  });
}
