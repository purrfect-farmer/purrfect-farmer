import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMoneyBuxTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["money-bux", "task"],
    mutationFn: ({ category, id, hash }) =>
      api
        .post(
          `https://moneybux.xyz/earnings/tasks_${category}`,
          new URLSearchParams({
            id,
            hash,
          })
        )
        .then((res) => res.data),
  });
}
