import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureBuyBoostMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "boost", "buy"],
    mutationFn: async ({ id, method = "free" }) =>
      api
        .post(
          "https://space-adventure.online/api/boost/buy/",
          {
            method,
            id,
          },
          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
