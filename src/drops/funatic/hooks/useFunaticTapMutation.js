import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticTapMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "tap"],
    mutationFn: (taps) =>
      api
        .post("https://clicker.api.funtico.com/tap", {
          taps,
        })
        .then((res) => res.data.data),
  });
}
