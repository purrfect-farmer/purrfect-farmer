import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useNotPixelMiningClaimMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["notpixel", "mining", "claim"],
    mutationFn: () =>
      api.get("https://notpx.app/api/v1/mining/claim").then((res) => res.data),
  });
}
