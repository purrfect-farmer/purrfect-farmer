import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonDrawBasicBoxMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "shop", "draw-basic-box"],
    mutationFn: (drawAmount) =>
      api
        .post("https://wonton.food/api/v1/shop/draw-basic-box", {
          drawAmount,
        })
        .then((res) => res.data),
  });
}
