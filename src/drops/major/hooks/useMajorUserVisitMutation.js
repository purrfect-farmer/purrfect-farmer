import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMajorUserVisitMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["major", "user-visits", "visit"],
    mutationFn: () =>
      api
        .post("https://major.bot/api/user-visits/visit/")
        .then((res) => res.data),
  });
}
