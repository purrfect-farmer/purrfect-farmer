import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function usePettTakeShowerMutation() {
  const { messenger } = useFarmerContext();

  return useMutation({
    mutationKey: ["pett", "take-shower"],
    async mutationFn() {
      const start = await messenger.returnToHome();
      const result = await messenger.clickPath(start, "Bathroom > Shower");

      return result;
    },
  });
}
