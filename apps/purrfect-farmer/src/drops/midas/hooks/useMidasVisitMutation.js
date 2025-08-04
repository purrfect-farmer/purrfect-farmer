import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMidasVisitMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["midas", "visit"],
    mutationFn: () =>
      api
        .post("https://api-tg-app.midas.app/api/user/visited", null)
        .then((res) => res.data),
  });
}
