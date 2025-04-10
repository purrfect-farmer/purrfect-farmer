import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function usePettBuyFoodMutation() {
  const { messenger } = useFarmerContext();

  return useMutation({
    mutationKey: ["pett", "buy-food"],
    async mutationFn(food) {
      const start = await messenger.returnToHome();
      const result = await messenger.clickPath(
        start,
        ["Store", "Cafeteria", food, "Buy 💵"].join(" > ")
      );

      return result;
    },
  });
}
