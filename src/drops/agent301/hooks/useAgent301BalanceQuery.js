import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useAgent301BalanceQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["agent301", "balance"],
    queryFn: ({ signal }) =>
      api
        .post("https://api.agent301.org/getMe", null, {
          signal,
        })
        .then((res) => res.data),
  });
}
