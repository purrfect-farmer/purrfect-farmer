import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useNotPixelSecretWordMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["notpixel", "secret", "word"],
    mutationFn: (word) =>
      api
        .post(
          "https://notpx.app/api/v1/mining/quest/check/secretWord",
          {
            secret_word: word,
          },
          {
            ignoreUnauthenticatedError: true,
          }
        )
        .then((res) => res.data),
  });
}
