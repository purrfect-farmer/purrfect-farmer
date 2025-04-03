import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function usePettBuyFoodMutation() {
  const { messenger } = useFarmerContext();

  return useMutation({
    mutationKey: ["pett", "buy-food"],
    async mutationFn() {
      const start = await messenger.sendStart();
      const result = await messenger.clickPath(start, "Store > Cafeteria");

      return result;
    },
  });
}
