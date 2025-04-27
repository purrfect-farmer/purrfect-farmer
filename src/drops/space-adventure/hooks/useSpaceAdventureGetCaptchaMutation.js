import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureGetCaptchaMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "get-captcha"],
    mutationFn: async () =>
      api
        .get(
          "https://space-adventure.online/api/game/captcha/",

          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
