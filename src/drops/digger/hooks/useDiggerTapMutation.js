import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerTapMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["digger", "tap"],
    mutationFn: ({ uid, cnt }) =>
      api
        .post("https://api.diggergame.app/api/play/tap", {
          uid,
          cnt,
        })
        .then((res) => res.data.result),
  });
}
