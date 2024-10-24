import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useGoatsCheckInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["goats", "check-in", "complete"],
    mutationFn: (id) =>
      api
        .post(`https://api-checkin.goatsbot.xyz/checkin/action/${id}`, null)
        .then((res) => res.data),
  });
}
