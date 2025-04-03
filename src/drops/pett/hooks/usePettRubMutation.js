import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function usePettRubMutation() {
  const { messenger } = useFarmerContext();

  return useMutation({
    mutationKey: ["pett", "rub"],
    async mutationFn() {
      const start = await messenger.returnToHome();
      const result = await messenger.clickPath(start, "Bathroom > Rub");

      return result;
    },
  });
}
