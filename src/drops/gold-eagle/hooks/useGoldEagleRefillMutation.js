import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useGoldEagleRefillMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "refill"],
    mutationFn: () =>
      api
        .post("https://gold-eagle-api.fly.dev/user/me/refill")
        .then((res) => res.data),
  });
}
