import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticSetExchangeMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "exchange", "set"],
    mutationFn: (exchangeId) =>
      api
        .post("https://api2.funtico.com/api/lucky-funatic/set-exchange", {
          exchangeId,
        })
        .then((res) => res.data),
  });
}
