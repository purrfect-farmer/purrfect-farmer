import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektBidMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "bid"],
    mutationFn: ({ bidType, timestamp }) =>
      api
        .post("https://rekt-mini-app.vercel.app/api/bid/", {
          bidType,
          timestamp,
        })
        .then((res) => res.data),
  });
}
