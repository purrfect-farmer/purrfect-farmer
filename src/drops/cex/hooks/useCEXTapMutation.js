import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useCEXTapMutation() {
  const { api, payload } = useFarmerContext();
  return useMutation({
    mutationKey: ["cex", "tap"],
    mutationFn: ({ tapsEnergy, tapsToClaim }) =>
      api
        .post(
          "https://app.cexptap.com/api/v2/claimMultiTaps",
          {
            ...payload,
            data: {
              tapsEnergy: tapsEnergy.toString(),
              tapsToClaim: tapsToClaim.toString(),
              tapsTs: Date.now(),
            },
          },
          {
            ignoreUnauthenticatedError: true,
          }
        )
        .then((res) => res.data),
  });
}
