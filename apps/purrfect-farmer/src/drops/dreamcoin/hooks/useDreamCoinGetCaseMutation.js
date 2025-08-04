import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinGetCaseMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "get-case"],
    mutationFn: (id) =>
      api.get(`https://api.dreamcoin.ai/Cases/${id}`).then((res) => res.data),
  });
}
