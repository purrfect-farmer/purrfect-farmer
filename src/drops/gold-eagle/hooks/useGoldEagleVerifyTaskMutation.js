import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useGoldEagleVerifyTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "task", "verify"],
    mutationFn: (id) =>
      api
        .post(
          `https://gold-eagle-api.fly.dev/task/mark/verify/${id}/social`,
          null
        )
        .then((res) => res.data),
  });
}
