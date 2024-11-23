import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinOpenCaseMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "open-case"],
    mutationFn: (caseId) =>
      api
        .post(`https://api.dreamcoin.ai/Cases/${caseId}/open`, {
          caseId,
        })
        .then((res) => res.data),
  });
}
