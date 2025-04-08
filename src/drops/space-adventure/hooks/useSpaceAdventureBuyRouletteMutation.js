import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureBuyRouletteMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "roulette", "buy"],
    mutationFn: () =>
      api
        .post("https://space-adventure.online/api/roulette/buy/", {
          method: "free",
        })
        .then((res) => res.data),
  });
}
