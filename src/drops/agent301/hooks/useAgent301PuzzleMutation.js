import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useAgent301PuzzleMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["agent301", "puzzle", "check"],
    mutationFn: (cards = []) =>
      api
        .post("https://api.agent301.org/cards/check", { cards })
        .then((res) => res.data),
  });
}
