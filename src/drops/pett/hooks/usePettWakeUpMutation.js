import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function usePettWakeUpMutation() {
  const { messenger } = useFarmerContext();

  return useMutation({
    mutationKey: ["pett", "wake-up"],
    async mutationFn() {
      const start = await messenger.returnToHome();
      const result = await messenger.clickPath(start, "Bedroom > Wake Up");

      return result;
    },
  });
}
