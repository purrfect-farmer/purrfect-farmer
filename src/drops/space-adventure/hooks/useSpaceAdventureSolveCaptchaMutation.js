import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureSolveCaptchaMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "solve-captcha"],
    mutationFn: async (captcha) =>
      api
        .post(
          "https://space-adventure.online/api/game/captcha/",
          { captcha },

          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
