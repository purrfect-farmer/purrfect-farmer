import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticClaimDailyBonusMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "daily-bonus", "claim"],
    mutationFn: () =>
      api
        .post(
          "https://api2.funtico.com/api/lucky-funatic/daily-bonus/claim",
          null
        )
        .then((res) => res.data.data),
  });
}
