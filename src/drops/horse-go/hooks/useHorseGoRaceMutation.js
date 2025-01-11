import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useHorseGoRaceMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["horse-go", "race"],
    mutationFn: (data) =>
      api
        .post("https://api.horsego.vip/user_api/race", data)
        .then((res) => res.data.data),
  });
}
