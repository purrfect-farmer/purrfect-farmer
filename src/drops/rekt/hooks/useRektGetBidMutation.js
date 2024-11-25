import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektGetBidMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "get", "bid"],
    mutationFn: (id) =>
      api
        .get(`https://rekt-mini-app.vercel.app/api/bid/${id}`)
        .then((res) => res.data),
  });
}
