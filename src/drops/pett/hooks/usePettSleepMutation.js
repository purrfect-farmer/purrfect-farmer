import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function usePettSleepMutation() {
  const { messenger } = useFarmerContext();

  return useMutation({
    mutationKey: ["pett", "sleep"],
    async mutationFn() {
      const start = await messenger.sendStart();
      const result = await messenger.clickPath(start, "Bedroom > Sleep");

      return result;
    },
  });
}
