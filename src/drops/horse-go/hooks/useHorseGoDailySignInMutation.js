import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useHorseGoDailySignInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["horse-go", "daily-sign-in", "claim"],
    mutationFn: () =>
      api
        .post("https://api.horsego.vip/user_api/dailySignIn")
        .then((res) => res.data.data),
  });
}
