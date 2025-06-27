import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureBuyRouletteMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "roulette", "buy"],
    mutationFn: async () =>
      api
        .post(
          "https://space-adventure.online/api/roulette/buy/",
          {
            method: "free",
          },
          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
