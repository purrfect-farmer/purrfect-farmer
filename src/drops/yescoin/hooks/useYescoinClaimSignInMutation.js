import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinClaimSignInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "sign-in", "claim"],
    mutationFn: ({ headers, body }) =>
      api
        .post("https://bi.yescoin.gold/signIn/claim", body, {
          headers,
        })
        .then((res) => res.data.data),
  });
}
