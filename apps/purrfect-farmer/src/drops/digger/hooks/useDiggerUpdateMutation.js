import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerUpdateMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["digger", "update"],
    mutationFn: ({ uid, status }) =>
      api
        .post("https://api.diggergame.app/api/content/update", {
          uid,
          status,
        })
        .then((res) => res.data.result),
  });
}
