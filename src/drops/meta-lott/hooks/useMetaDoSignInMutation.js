import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMetaDoSignInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["meta-lott", "do", "sign-in"],
    mutationFn: () =>
      api
        .post("https://www.metalott.com/core/app/signIn/do")
        .then((res) => res.data.result),
  });
}
